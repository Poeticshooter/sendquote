import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "ENCRYPTION_KEY";

function getKey(): Buffer {
  const key = process.env[KEY_ENV];
  if (!key || key.length < 32) {
    throw new Error(
      `ENCRYPTION_KEY must be at least 32 characters. Set it in .env.local`
    );
  }
  return crypto.scryptSync(key, "sendquote-salt", 32);
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted text format");
  const [ivHex, authTagHex, data] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
