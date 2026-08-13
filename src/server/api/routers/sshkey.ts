import * as z from "zod"

import { publicProcedure } from "@/server/api"
import { insertSshKeySchema, selectSshKeySchema } from "@/server/db/schema"

const mockSshKeys: z.infer<typeof selectSshKeySchema>[] = [
  {
    createdAt: new Date(),
    fingerprint: "SHA256:abc123",
    id: "1",
    name: "SSH Key 1",
    organizationId: "org1",
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    fingerprint: "SHA256:def456",
    id: "2",
    name: "SSH Key 2",
    organizationId: "org1",
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD...",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    fingerprint: "SHA256:ghi789",
    id: "3",
    name: "SSH Key 3",
    organizationId: "org2",
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQE...",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    fingerprint: "SHA256:jkl012",
    id: "4",
    name: "SSH Key 4",
    organizationId: "org2",
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQF...",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    fingerprint: "SHA256:mno345",
    id: "5",
    name: "SSH Key 5",
    organizationId: "org3",
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQG...",
    updatedAt: new Date(),
  },
]

export const sshKeyRouter = {
  create: publicProcedure
    .route({
      method: "POST",
      path: "/sshkey/create",
      summary: "Create a new SSH key",
      tags: ["SSH Keys"],
    })
    .input(z.object(insertSshKeySchema.shape))
    .output(z.object(selectSshKeySchema.shape))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "SSH key not found",
      },
    })
    .handler(({ context, errors, input }) => {
      if (!input) throw errors.BAD_REQUEST()

      const newSshKey = {
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSshKeys.push(newSshKey)

      if (!newSshKey.id) throw errors.NOT_FOUND()

      return newSshKey
    }),

  list: publicProcedure
    .route({
      method: "GET",
      path: "/sshkeys",
      summary: "List all SSH keys",
      tags: ["SSH Keys"],
    })
    .output(z.array(selectSshKeySchema))
    .errors({
      NOT_FOUND: {
        message: "SSH keys not found",
      },
    })
    .handler(({ context, errors }) => {
      const sshKeys = mockSshKeys
      if (!sshKeys) throw errors.NOT_FOUND()
      return sshKeys
    }),
}
