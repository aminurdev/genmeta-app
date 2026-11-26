import crypto from "crypto";
import config from "../config/index.js";

const ALGORITHM = "aes-256-cbc";

const getKey = () => {
  const secret = config.encoderKey;
  if (!secret) {
    throw new Error("GEMINI_ENCODER_KEY is not defined in environment variables");
  }
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

/**
 * Validate/normalize an AI API key before sending it to the desktop client.
 * - Plaintext keys are encrypted with the active encoderKey.
 * - Encrypted `iv:ciphertext` values are verified against the active encoderKey;
 *   returns null and logs a warning if decryption fails.
 * @param {string | null | undefined} rawKey
 * @returns {string | null}
 */
export function resolveAiApiKeyForClient(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return null;
  const trimmed = rawKey.trim();
  if (!trimmed) return null;

  if (!trimmed.includes(":")) {
    return encrypt(trimmed);
  }

  try {
    const parts = trimmed.split(":");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
      .toString("utf8")
      .trim();
    return decrypted ? trimmed : null;
  } catch (error) {
    console.warn(
      "Stored AiAPI key cannot be decrypted with current GEMINI_ENCODER_KEY; please re-save it in the admin panel:",
      error.message
    );
    return null;
  }
}
