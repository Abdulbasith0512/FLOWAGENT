import { createHash, randomBytes, createCipheriv } from "node:crypto";

function encryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? "change-me-dev-only-encryption";
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, enc, tag]).toString("base64");
}
