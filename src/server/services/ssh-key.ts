import { createHash, randomBytes } from "node:crypto"

function bufferToLengthEncoded(buf: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(buf.length)
  return Buffer.concat([len, buf])
}

function stringToLengthEncoded(str: string): Buffer {
  return bufferToLengthEncoded(Buffer.from(str, "utf8"))
}

export function buildEd25519PublicKeyBlob(publicKeyRaw: Buffer): Buffer {
  return Buffer.concat([
    stringToLengthEncoded("ssh-ed25519"),
    bufferToLengthEncoded(publicKeyRaw),
  ])
}

export function formatSSHPublicKey(blob: Buffer, comment: string): string {
  return `ssh-ed25519 ${blob.toString("base64")} ${comment}`
}

export function fingerprintSSHPublicKey(blob: Buffer): string {
  const sha256 = createHash("sha256").update(blob).digest("base64")
  return `SHA256:${sha256.replace(/=+$/, "")}`
}

export function buildOpenSSHEd25519PrivateKey(
  publicKeyRaw: Buffer,
  privateKeySeed: Buffer,
  comment: string,
): string {
  const MAGIC = Buffer.from("openssh-key-v1\0", "utf8")

  const sshPublicKeyBlob = Buffer.concat([
    stringToLengthEncoded("ssh-ed25519"),
    bufferToLengthEncoded(publicKeyRaw),
  ])

  const ed25519PrivateKeyField = Buffer.concat([privateKeySeed, publicKeyRaw])

  const checkint = randomBytes(4)

  const privateSection = Buffer.concat([
    checkint,
    checkint,
    stringToLengthEncoded("ssh-ed25519"),
    bufferToLengthEncoded(publicKeyRaw),
    bufferToLengthEncoded(ed25519PrivateKeyField),
    stringToLengthEncoded(comment),
  ])

  const blockSize = 8
  const padLength =
    (blockSize - (privateSection.length % blockSize)) % blockSize
  const padding = Buffer.from(
    Array.from({ length: padLength }, (_, idx) => idx + 1),
  )
  const paddedPrivateSection = Buffer.concat([privateSection, padding])

  const body = Buffer.concat([
    MAGIC,
    stringToLengthEncoded("none"),
    stringToLengthEncoded("none"),
    stringToLengthEncoded(""),
    Buffer.from([0, 0, 0, 1]),
    bufferToLengthEncoded(sshPublicKeyBlob),
    bufferToLengthEncoded(paddedPrivateSection),
  ])

  const base64Body = body.toString("base64")
  const wrapped = base64Body.match(/.{1,70}/g)?.join("\n") ?? base64Body

  return `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrapped}\n-----END OPENSSH PRIVATE KEY-----\n`
}
