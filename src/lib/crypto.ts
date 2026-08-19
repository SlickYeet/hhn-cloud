import { randomBytes } from "node:crypto"

export function generateRootPassword(length: number = 16): string {
  return randomBytes(length).toString("base64").slice(0, length)
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
