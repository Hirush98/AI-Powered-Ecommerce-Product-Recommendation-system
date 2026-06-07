const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");

/**
 * Generate a short-lived access token (15min)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

/**
 * Generate a secure random refresh token string,
 * persist it to MongoDB, return the raw token string
 */
const generateRefreshToken = async (
  userId,
  userAgent = null,
  ipAddress = null,
) => {
  // Secure random token — not JWT, just a long random string
  const token = crypto.randomBytes(64).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({
    userId,
    token,
    expiresAt,
    userAgent,
    ipAddress,
  });

  return token;
};

/**
 * Verify access token — returns decoded payload or throws
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Validate a refresh token from DB
 * Returns the token document if valid, throws if not
 */
const validateRefreshToken = async (token) => {
  const tokenDoc = await RefreshToken.findOne({ token }).populate("userId");

  if (!tokenDoc) {
    throw new Error("Refresh token not found");
  }
  if (tokenDoc.isRevoked) {
    throw new Error("Refresh token has been revoked");
  }
  if (tokenDoc.expiresAt < new Date()) {
    throw new Error("Refresh token has expired");
  }

  return tokenDoc;
};

/**
 * Revoke a single refresh token (logout current device)
 */
const revokeRefreshToken = async (token) => {
  await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
};

/**
 * Revoke ALL refresh tokens for a user (logout all devices)
 */
const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true },
  );
};

/**
 * Set refresh token as HttpOnly cookie
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true, // not accessible via JS
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/api/auth", // only sent to auth routes
  });
};

/**
 * Clear refresh token cookie (on logout)
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/api/auth",
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
