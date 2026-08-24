import { createAccessControl } from "better-auth/plugins"

const statements = {
  apiKey: ["create", "read", "update", "delete"],
  instance: ["create", "read", "update", "delete"],
} as const

export const ac = createAccessControl(statements)

export const adminRole = ac.newRole({
  apiKey: ["create", "read", "update", "delete"],
  instance: ["create", "read", "update", "delete"],
})

export const memberRole = ac.newRole({
  apiKey: ["read"],
  instance: ["read"],
})
