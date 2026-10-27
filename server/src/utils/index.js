import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user.model.js";
import ApiError from "./api.error.js";

/**
 * Generate Access and Refresh JWT Tokens for a given user
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Token generation error:", err);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

/**
 * Generate a random alphanumeric code (e.g. for referrals or promo codes)
 * @param {number} length
 * @param {number} letterRatio
 * @returns {string}
 */
export const generateCode = (length = 6, letterRatio = 0.7) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let code = "";
  // First character must be an alphabetic letter
  code += letters[Math.floor(Math.random() * letters.length)];

  for (let i = 1; i < length; i++) {
    if (Math.random() < letterRatio) {
      code += letters[Math.floor(Math.random() * letters.length)];
    } else {
      code += numbers[Math.floor(Math.random() * numbers.length)];
    }
  }

  return code;
};

/**
 * Generate a cryptographically secure App Key
 * @returns {string} sha256 hex string
 */
export function generateAppKey() {
  const buffer = crypto.randomBytes(32);
  const timestamp = Date.now().toString();
  const uuid = uuidv4();
  const combined = buffer.toString("hex") + timestamp + uuid;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Compare two semantic version strings (e.g., "1.2.0" vs "1.1.9")
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 === v2
 *    1 if v1 > v2
 */
export function compareVersions(v1, v2) {
  const p1 = (v1 || "0.0.0").split(".").map((num) => parseInt(num, 10) || 0);
  const p2 = (v2 || "0.0.0").split(".").map((num) => parseInt(num, 10) || 0);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
