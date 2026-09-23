const crypto = require('crypto');
const redisClient = require('./redis');
const logger = require('../utils/logger');

/**
 * Refresh-session store.
 *
 * Stores sha256(refreshToken) -> { userId, familyId, createdAt } with a
 * 7-day TTL. Redis-backed when REDIS_URL is configured (multi-instance
 * safe); falls back to an in-process Map for single-instance/dev use.
 *
 * Rotation semantics: rotateSession() deletes the presented token BEFORE
 * issuing the next one, so a replayed (already-rotated) token fails to
 * look up and is rejected — the standard refresh-token reuse defence.
 */

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// In-memory fallback: <sessionKey, {data, expiresAt}> + <userKey, Set<sessionKey>>
const memSessions = new Map();
const memUserIndex = new Map();

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

// ---- Low-level key/value with TTL (Redis or memory) ----
const kv = {
  async set(key, data, ttlSeconds) {
    if (redisClient) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      return;
    }
    memSessions.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  async get(key) {
    if (redisClient) {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    }
    const entry = memSessions.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      memSessions.delete(key);
      return null;
    }
    return entry.data;
  },
  async del(key) {
    if (redisClient) {
      await redisClient.del(key);
      return;
    }
    memSessions.delete(key);
  },
  async addToIndex(indexKey, memberKey) {
    if (redisClient) {
      await redisClient.sAdd(indexKey, memberKey);
      await redisClient.expire(indexKey, REFRESH_TOKEN_TTL_SECONDS);
      return;
    }
    if (!memUserIndex.has(indexKey)) memUserIndex.set(indexKey, new Set());
    memUserIndex.get(indexKey).add(memberKey);
  },
  async removeFromIndex(indexKey, memberKey) {
    if (redisClient) {
      await redisClient.sRem(indexKey, memberKey);
      return;
    }
    const set = memUserIndex.get(indexKey);
    if (set) set.delete(memberKey);
  },
  async indexMembers(indexKey) {
    if (redisClient) {
      return await redisClient.sMembers(indexKey);
    }
    return Array.from(memUserIndex.get(indexKey) || []);
  },
};

const SESSION_KEY = (sessionId) => `rf:${sessionId}`;
const USER_INDEX_KEY = (userId) => `rfuser:${userId}`;

async function createSession(userId) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const sessionId = hashToken(refreshToken);
  const data = { userId: String(userId), familyId: crypto.randomUUID(), createdAt: Date.now() };
  await kv.set(SESSION_KEY(sessionId), data, REFRESH_TOKEN_TTL_SECONDS);
  await kv.addToIndex(USER_INDEX_KEY(String(userId)), sessionId);
  return { refreshToken, familyId: data.familyId };
}

async function verifySession(refreshToken) {
  if (!refreshToken) return null;
  return kv.get(SESSION_KEY(hashToken(refreshToken)));
}

/**
 * Rotate a refresh token. Returns:
 *   { ok: true,  session, next: { refreshToken } } on success
 *   { ok: false, reason: 'invalid' } when the token is unknown/replayed/expired
 */
async function rotateSession(refreshToken) {
  const sessionId = hashToken(refreshToken);
  const session = await kv.get(SESSION_KEY(sessionId));
  if (!session) return { ok: false, reason: 'invalid' };

  // Delete BEFORE issuing the next token: a replay of this token after
  // rotation fails the lookup and cannot mint a new session.
  await kv.del(SESSION_KEY(sessionId));
  await kv.removeFromIndex(USER_INDEX_KEY(session.userId), sessionId);

  const nextToken = crypto.randomBytes(48).toString('hex');
  const nextId = hashToken(nextToken);
  const nextData = { userId: session.userId, familyId: session.familyId, createdAt: Date.now() };
  await kv.set(SESSION_KEY(nextId), nextData, REFRESH_TOKEN_TTL_SECONDS);
  await kv.addToIndex(USER_INDEX_KEY(session.userId), nextId);

  return { ok: true, session, next: { refreshToken: nextToken, familyId: session.familyId } };
}

async function revokeSession(refreshToken) {
  if (!refreshToken) return;
  const sessionId = hashToken(refreshToken);
  const session = await kv.get(SESSION_KEY(sessionId));
  if (session) {
    await kv.removeFromIndex(USER_INDEX_KEY(session.userId), sessionId);
  }
  await kv.del(SESSION_KEY(sessionId));
}

/** Revoke every refresh session for a user (used on password change). */
async function revokeAllUserSessions(userId) {
  const keys = await kv.indexMembers(USER_INDEX_KEY(String(userId)));
  for (const sessionId of keys) {
    await kv.del(SESSION_KEY(sessionId));
  }
  await kv.del(USER_INDEX_KEY(String(userId)));
  logger.info(`Revoked ${keys.length} refresh session(s) for user ${userId}`);
}

module.exports = {
  REFRESH_TOKEN_TTL_SECONDS,
  createSession,
  verifySession,
  rotateSession,
  revokeSession,
  revokeAllUserSessions,
};
