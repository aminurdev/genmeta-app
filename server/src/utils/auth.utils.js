import crypto from "crypto";
import bcrypt from "bcrypt";
import config from "../config/index.js";

export const ACCESS_COOKIE_NAME = "gm_access_token";
export const REFRESH_COOKIE_NAME = "gm_refresh_token";
export const SESSION_HINT_COOKIE_NAME = "gm_has_session";
export const LEGACY_COOKIE_NAMES = ["accessToken", "refreshToken"];

const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  crypto.randomBytes(16).toString("hex"),
  config.bcrypt_rounds || 12
);

export const getDummyPasswordHash = () => DUMMY_PASSWORD_HASH;

export const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

export const timingSafeHashEqual = (hashA, hashB) => {
  if (!hashA || !hashB) return false;
  const bufA = Buffer.from(String(hashA), "utf8");
  const bufB = Buffer.from(String(hashB), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

export const generateOpaqueToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

export const parseDurationToMs = (input, fallbackMs) => {
  if (typeof input === "number" && Number.isFinite(input) && input > 0) {
    return input;
  }
  if (typeof input !== "string") return fallbackMs;

  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    const ms = Number(trimmed);
    return ms > 0 ? ms : fallbackMs;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const result = Math.round(amount * (multipliers[unit] || 1));
  return Number.isFinite(result) && result > 0 ? result : fallbackMs;
};

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded)
      ? forwarded[0]
      : String(forwarded).split(",")[0];
    if (first?.trim()) {
      return first.trim().replace(/^::ffff:/, "");
    }
  }
  const ip = req.ip || req.socket?.remoteAddress || "";
  return String(ip).replace(/^::ffff:/, "").trim();
};

export const parseUserAgent = (ua = "") => {
  const s = String(ua || "");
  if (!s) return "Unknown Device";

  let browser = "Browser";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/Firefox\//i.test(s)) browser = "Firefox";
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = "Chrome";
  else if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) {
    browser = /iPhone|iPad|iPod/i.test(s) ? "Mobile Safari" : "Safari";
  } else if (/curl|postman|insomnia|axios|node/i.test(s)) {
    browser = "API Client";
  }

  let os = "Unknown OS";
  if (/Windows NT/i.test(s)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/Linux/i.test(s)) os = "Linux";

  return `${browser} on ${os}`;
};

export const sanitizeRedirectPath = (path, fallback = "/dashboard") => {
  if (typeof path !== "string") return fallback;
  const trimmed = path.trim();
  if (
    !trimmed ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /^\/[a-zA-Z]+:/.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
};

export const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: Boolean(config.cookie_secure),
  sameSite: config.cookie_same_site || "lax",
  path: "/",
  maxAge: maxAgeMs,
  ...(config.cookie_domain ? { domain: config.cookie_domain } : {}),
});

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const accessMaxAge = parseDurationToMs(
    config.access_token_expiry,
    15 * 60 * 1000
  );
  const refreshMaxAge = parseDurationToMs(
    config.refresh_token_expiry,
    30 * 24 * 60 * 60 * 1000
  );

  res.cookie(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(refreshMaxAge));
  res.cookie(SESSION_HINT_COOKIE_NAME, "1", {
    ...getCookieOptions(refreshMaxAge),
    httpOnly: false,
  });

  for (const legacyName of LEGACY_COOKIE_NAMES) {
    res.clearCookie(legacyName, { path: "/" });
  }
};

export const clearAuthCookies = (res) => {
  const baseClearOptions = {
    httpOnly: true,
    secure: Boolean(config.cookie_secure),
    sameSite: config.cookie_same_site || "lax",
    path: "/",
    ...(config.cookie_domain ? { domain: config.cookie_domain } : {}),
  };

  res.clearCookie(ACCESS_COOKIE_NAME, baseClearOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, baseClearOptions);
  res.clearCookie(SESSION_HINT_COOKIE_NAME, {
    ...baseClearOptions,
    httpOnly: false,
  });

  for (const legacyName of LEGACY_COOKIE_NAMES) {
    res.clearCookie(legacyName, { path: "/" });
  }
};

export const serializeUser = (user) => {
  if (!user) return null;
  const userIdStr = user._id?.toString?.() || String(user._id);
  return {
    _id: user._id,
    id: userIdStr,
    userId: userIdStr,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: Boolean(user.isVerified),
    isDisabled: Boolean(user.isDisabled),
    loginProvider: Array.isArray(user.loginProvider) ? user.loginProvider : [],
    avatar: user.avatar || null,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.referralCode ? { referralCode: user.referralCode } : {}),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null,
  };
};
