import type { KeyObject } from "node:crypto"
import { generateKeyPair, randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { count, eq } from "drizzle-orm"
import * as z from "zod"

import {
  generateSSHKeySchema,
  importSSHKeySchema,
  selectSSHKeySchema,
} from "@/schemas/ssh-key"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { sshKeyTable } from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"
import { logActivity } from "@/server/services/activity"
import type { ParsedSSHPublicKey } from "@/server/services/ssh-key"
import {
  buildEd25519PublicKeyBlob,
  buildOpenSSHEd25519PrivateKey,
  fingerprintSSHPublicKey,
  formatSSHPublicKey,
  parseSSHPublicKey,
} from "@/server/services/ssh-key"

export const sshKeyRouter = createTRPCRouter({
  count: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/sshkey/count",
          summary: "Count all SSH keys for the active organization",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const [sshKeyCount] = await ctx.db
        .select({ count: count() })
        .from(sshKeyTable)
        .where(eq(sshKeyTable.organizationId, ctx.organizationId))

      return sshKeyCount.count
    }),

  generate: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/sshkey/generate",
          summary: "Generate a new SSH key",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .input(generateSSHKeySchema)
    .output(z.object({ ...selectSSHKeySchema.shape, privateKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { privateKey, publicKey } = await new Promise<{
        publicKey: KeyObject
        privateKey: KeyObject
      }>((resolve, reject) => {
        generateKeyPair("ed25519", {}, (err, publicKey, privateKey) => {
          if (err) reject(err)
          else resolve({ privateKey, publicKey })
        })
      })

      const name = input.name.toLowerCase().replace(/\s/g, "_")

      const jwkPub = publicKey.export({ format: "jwk" })
      if (!jwkPub.x) throw new Error("Invalid JWK")
      const pubKeyBuffer = Buffer.from(jwkPub.x, "base64url")

      const blob = buildEd25519PublicKeyBlob(pubKeyBuffer)
      const publicKeyString = formatSSHPublicKey(blob, name)
      const fingerprint = fingerprintSSHPublicKey(blob)

      const jwkPriv = privateKey.export({ format: "jwk" })
      if (!jwkPriv.d) throw new Error("Invalid private JWK")
      const privateKeySeed = Buffer.from(jwkPriv.d, "base64url")

      const privateKeyPem = buildOpenSSHEd25519PrivateKey(
        pubKeyBuffer,
        privateKeySeed,
        name,
      )

      try {
        const [sshKey] = await ctx.db
          .insert(sshKeyTable)
          .values({
            fingerprint,
            id: randomUUID(),
            name,
            organizationId: ctx.organizationId,
            publicKey: publicKeyString,
            type: "ed25519",
            userId: ctx.session.session.userId,
          })
          .returning()

        await logActivity(ctx.db, "ssh_key_generated", {
          actorId: ctx.session.session.userId,
          actorSnapshot: ctx.session.user,
          actorType: "user",
          channel: "api",
          metadata: {},
          organizationId: ctx.organizationId,
          referenceId: sshKey.id,
          referenceType: "ssh_key",
        })

        return {
          ...sshKey,
          privateKey: privateKeyPem,
        }
      } catch (error) {
        if (isUniqueConstraintError(error, "ssh_key_name_idx")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SSH key name already exists",
          })
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        })
      }
    }),

  import: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/sshkey/import",
          summary: "Import an existing SSH key",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .input(importSSHKeySchema)
    .output(selectSSHKeySchema)
    .mutation(async ({ ctx, input }) => {
      const name = input.name.toLowerCase().replace(/\s/g, "_")

      let parsed: ParsedSSHPublicKey
      try {
        parsed = parseSSHPublicKey(input.publicKey)
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Invalid public key",
        })
      }

      try {
        const [sshKey] = await ctx.db
          .insert(sshKeyTable)
          .values({
            comment: input.comment || parsed.comment || null,
            fingerprint: parsed.fingerprint,
            id: randomUUID(),
            name,
            organizationId: ctx.organizationId,
            publicKey: parsed.publicKeyString,
            type: parsed.type,
            userId: ctx.session.session.userId,
          })
          .returning()

        await logActivity(ctx.db, "ssh_key_imported", {
          actorId: ctx.session.session.userId,
          actorSnapshot: ctx.session.user,
          actorType: "user",
          channel: "api",
          metadata: {},
          organizationId: ctx.organizationId,
          referenceId: sshKey.id,
          referenceType: "ssh_key",
        })

        return sshKey
      } catch (error) {
        if (isUniqueConstraintError(error, "ssh_key_name_idx")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SSH key name already exists",
          })
        }
        if (isUniqueConstraintError(error, "ssh_key_fingerprint_idx")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SSH key already exists",
          })
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        })
      }
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/sshkeys",
          summary: "List all SSH keys for the active organization",
          tags: ["SSH Keys"],
        }),
      ),
    )
    .output(z.array(selectSSHKeySchema))
    .query(async ({ ctx }) => {
      const sshKeys = await ctx.db.query.sshKeyTable.findMany({
        where: (sshKey, { eq }) =>
          eq(sshKey.organizationId, ctx.organizationId),
      })

      if (!sshKeys || sshKeys.length === 0) return []

      return sshKeys
    }),
})
