import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

import { env } from "@/env"

const KEY_VERSION = "v1"
const KEYS: Record<string, Buffer> = {
  v1: Buffer.from(env.ENCRYPTION_KEY_V1, "base64"),
}
const ALGORITHM = "aes-256-gcm"

export function generateRootPassword(length: number = 16): string {
  const bytes = randomBytes(length)
  return bytes.toString("base64url").slice(0, length)
}

export function encryptPassword(password: string): string {
  const key = KEYS[KEY_VERSION]

  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(password, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag() as Buffer

  return `${KEY_VERSION}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

export function decryptPassword(composite: string): string {
  const [version, ivHex, authTagHex, encrypted] = composite.split(":")

  if (!version || !ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid or corrupted encrypted password format.")
  }

  const key = KEYS[version]
  if (!key) throw new Error(`Unknown key version: ${version}`)

  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

export function generateMacAddress(): string {
  const macAddress = [
    "BC",
    ...Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0"),
    ),
  ].join(":")
  return macAddress.toUpperCase()
}
