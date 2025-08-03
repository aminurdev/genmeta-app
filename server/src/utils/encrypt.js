import crypto from "crypto";
import config from "../config/index.js";

const secret = config.encoderKey;

if (typeof secret !== "string") {
  throw new Error("Missing or invalid config.encoderKey");
}

const key = crypto.createHash("sha256").update(secret).digest(); // 32 bytes
const algorithm = "aes-256-cbc";

// Encrypt function
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Decrypt function
function decrypt(encryptedText) {
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString();
}

export { encrypt, decrypt };
