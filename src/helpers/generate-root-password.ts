import { randomBytes } from "node:crypto"

export function generateRootPassword(length: number = 16): string {
  return randomBytes(length).toString("base64").slice(0, length)
}
