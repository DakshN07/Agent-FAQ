const crypto = require('crypto');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../libs/redis');

/**
 * Stricter per-IP + per-email limiter for credential endpoints (login,
 * refresh, password change). The global 100 req/15min API limiter is too
 * lenient to stop brute force, so auth endpoints get their own budget.
 *
 * NOTE: relies on express.json() having run (app-level) so req.body is
 * available in keyGenerator.
 */
function createAuthLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many attempts for this account/IP. Please try again in 15 minutes.',
} = {}) {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Key on IP + normalized email (hashed so raw emails never sit in the
    // limiter store). Anonymous requests share an IP-scoped bucket.
    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req.ip, 56);
      const email =
        req.body && typeof req.body.email === 'string'
          ? req.body.email.trim().toLowerCase()
          : 'anonymous';
      return crypto.createHash('sha256').update(`${ip}:${email}`).digest('hex');
    },
    ...(redisClient
      ? { store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }) }
      : {}),
  });
}

module.exports = { createAuthLimiter };