import crypto from "crypto";
import config from "../config/index.js";

const ALGORITHM = "aes-256-cbc";

const getKey = () => {
  const secret = config.encoderKey || "default-secret-key-genmeta-32-chars";
  return crypto.createHash("sha256").update(String(secret)).digest(); // exactly 32 bytes
};

/**
 * Encrypt plain text using AES-256-CBC
 * @param {string} text
 * @returns {string} iv:ciphertext (hex encoded)
 */
export function encrypt(text) {
  if (!text) return "";
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (error) {
    console.error("Encryption failed:", error.message);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt cipher text using AES-256-CBC
 * @param {string} encryptedText iv:ciphertext (hex encoded)
 * @returns {string} decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      // If it's already plain text (or not formatted as iv:hex)
      return encryptedText;
    }
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption failed:", error.message);
    // If decryption fails, return as-is rather than crashing
    return encryptedText;
  }
}
