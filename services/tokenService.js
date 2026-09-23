const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const sessionStore = require('../libs/sessionStore');

/**
 * Access/refresh token issuance and session lifecycle.
 *
 * - Access tokens are short-lived JWTs (15 min) — a stolen token expires fast.
 * - Refresh tokens are opaque, server-stored (hashed) sessions that rotate on
 *   every use and are delivered via the httpOnly `rf` cookie (XSS-resistant).
 */

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_COOKIE_NAME = 'rf';
const REFRESH_COOKIE_MAX_AGE_MS = sessionStore.REFRESH_TOKEN_TTL_SECONDS * 1000;

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

/**
 * Issue a new access token + refresh session.
 * @returns {Promise<{accessToken: string, refreshToken: string, familyId: string}>}
 */
async function issueSession(user) {
  const session = await sessionStore.createSession(user._id || user.id);
  return {
    accessToken: signAccessToken(user),
    refreshToken: session.refreshToken,
    familyId: session.familyId,
  };
}

/**
 * Rotate a refresh token into a fresh access token + new refresh token.
 * @returns {Promise<{ok: boolean, reason?: string, accessToken?: string, refreshToken?: string, user?: object}>}
 */
async function refreshAccessToken(refreshToken) {
  const result = await sessionStore.rotateSession(refreshToken);
  if (!result.ok) return result;
  const user = await User.findById(result.session.userId).select('-password');
  if (!user) return { ok: false, reason: 'invalid' };
  return {
    ok: true,
    accessToken: signAccessToken(user),
    refreshToken: result.next.refreshToken,
    user,
  };
}

async function revokeSession(refreshToken) {
  return sessionStore.revokeSession(refreshToken);
}

async function revokeAllUserSessions(userId) {
  return sessionStore.revokeAllUserSessions(userId);
}

// ---- httpOnly cookie helpers ----
function refreshCookieOptions() {
  // Cross-origin (Vercel frontend -> Render API) requires SameSite=None +
  // Secure in production. Keep it Lax on http during dev/test.
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}

/** Pull the refresh token from the httpOnly cookie or the request body. */
function refreshTokenFromRequest(req) {
  const fromCookie = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
  const fromBody = req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : null;
  return fromCookie || fromBody;
}

module.exports = {
  ACCESS_TOKEN_TTL,
  REFRESH_COOKIE_NAME,
  signAccessToken,
  issueSession,
  refreshAccessToken,
  revokeSession,
  revokeAllUserSessions,
  setRefreshCookie,
  clearRefreshCookie,
  refreshTokenFromRequest,
};