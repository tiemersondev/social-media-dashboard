import "server-only";

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey() {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to persist social tokens.");
  }

  return crypto.createHash("sha256").update(rawKey).digest();
}

export function encryptToken(token: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptToken(encryptedToken: string) {
  const [iv, authTag, encrypted] = encryptedToken.split(".");

  if (!iv || !authTag || !encrypted) {
    throw new Error("Stored social token has an invalid encrypted format.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
