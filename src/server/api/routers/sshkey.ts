import type { KeyObject } from "node:crypto"
import { createHash, generateKeyPair, randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { count, eq } from "drizzle-orm"
import * as z from "zod"

import { createSshKeySchema, selectSshKeySchema } from "@/schemas/ssh-key"
import { protectedProcedure } from "@/server/api/base"
import { sshKeyTable } from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"

function bufferToLengthEncoded(buf: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(buf.length)
  return Buffer.concat([len, buf])
}

export const sshKeyRouter = {
  count: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/sshkey/count",
        summary: "Count all SSH keys for the active organization of the user",
        tags: ["SSH Keys"],
      }),
    )
    .output(z.number())
    .handler(async ({ context }) => {
      const [sshKeyCount] = await context.db
        .select({ count: count() })
        .from(sshKeyTable)
        .where(eq(sshKeyTable.organizationId, context.organizationId))

      return sshKeyCount.count
    }),

  create: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/sshkey/create",
        summary: "Create a new SSH key",
        tags: ["SSH Keys"],
      }),
    )
    .input(
      z.object({
        ...createSshKeySchema.shape,
        oranizationId: z.string().optional(),
      }),
    )
    .output(z.object({ ...selectSshKeySchema.shape, privateKey: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      CONFLICT: {
        message: "SSH key with the same name already exists",
      },
      INTERNAL_SERVER_ERROR: {
        message: "Internal server error",
      },
    })
    .handler(async ({ context, errors, input }) => {
      const { privateKey, publicKey } = await new Promise<{
        publicKey: KeyObject
        privateKey: KeyObject
      }>((resolve, reject) => {
        generateKeyPair("ed25519", {}, (err, publicKey, privateKey) => {
          if (err) reject(err)
          else resolve({ privateKey, publicKey })
        })
      })

      const privateKeyPem = privateKey.export({ format: "pem", type: "pkcs8" })

      const jwk = publicKey.export({ format: "jwk" })
      if (!jwk.x) throw new Error("Invalid JWK")

      const pubKeyBuffer = Buffer.from(jwk.x, "base64url")
      const sshKeyType = Buffer.from("ssh-ed25519")
      const blob = Buffer.concat([
        bufferToLengthEncoded(sshKeyType),
        bufferToLengthEncoded(pubKeyBuffer),
      ])

      const base64 = blob.toString("base64")
      const publicKeyString = `ssh-ed25519 ${base64} ${input.name.toLowerCase().replace(/\s/g, "_")}`

      const sha256 = createHash("sha256").update(blob).digest("base64")
      const fingerprint = `SHA256:${sha256.replace(/=+$/, "")}`

      try {
        const [sshKey] = await context.db
          .insert(sshKeyTable)
          .values({
            fingerprint,
            id: randomUUID(),
            name: input.name,
            organizationId: context.organizationId,
            publicKey: publicKeyString,
          })
          .returning()

        return {
          ...sshKey,
          privateKey: privateKeyPem,
        }
      } catch (error) {
        if (isUniqueConstraintError(error, "ssh_key_name_idx")) {
          throw errors.CONFLICT()
        }
        throw errors.INTERNAL_SERVER_ERROR()
      }
    }),

  list: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/sshkeys",
        summary: "List all SSH keys",
        tags: ["SSH Keys"],
      }),
    )
    .output(z.array(selectSshKeySchema))
    .handler(async ({ context }) => {
      const sshKeys = await context.db.query.sshKeyTable.findMany({
        where: (sshKey, { eq }) =>
          eq(sshKey.organizationId, context.organizationId),
      })

      if (!sshKeys || sshKeys.length === 0) return []

      return sshKeys
    }),
}
