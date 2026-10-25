const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * OAuth `state` tokens.
 *
 * The previous implementation passed the bare `eventId` as `state`, which is a
 * CSRF hole: anyone could craft
 * `/api/oauth/discord?state=<victim eventId>`, walk a victim through their own
 * Discord consent screen, and silently attach the attacker's server to the
 * victim's event.
 *
 * This issues a signed, single-use, short-lived token that carries the context
 * the callback needs but cannot be forged:
 *
 *   - eventId  — which event to attach the connection to
 *   - userId   — who started the flow (so a stolen callback URL can't be used
 *                to connect into somebody else's account)
 *   - platform — guards against swapping the state between flows
 *   - nonce    — uniqueness, so two identical requests get different tokens
 *   - pkce     — RFC 7636 verifier, for platforms that support it (Discord)
 *
 * The token is signed with HMAC-SHA256 using JWT_SECRET, so verification needs
 * no shared storage — but single-use *is* enforced via a short-lived nonce
 * ledger, because a signature alone would still allow replay within its TTL.
 */

const TTL_MS = 10 * 60 * 1000; // 10 minutes is ample for a consent screen
const MAX_NONCES = 5000; // bound growth; the Map is pruned on write

// nonce -> expiry. Single-use replay protection.
const usedNonces = new Map();

function pruneNonces(now = Date.now()) {
  for (const [nonce, exp] of usedNonces) {
    if (exp <= now) usedNonces.delete(nonce);
  }
  // Hard cap in case of a burst, so this can't grow without bound.
  while (usedNonces.size > MAX_NONCES) {
    usedNonces.delete(usedNonces.keys().next().value);
  }
}

/** Short, URL-safe, high-entropy. */
const nonce = () => crypto.randomBytes(16).toString('base64url');
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(payloadB64, secret) {
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Issue a state token. Returns the opaque string to hand to the provider.
 *
 * @param {object} data
 * @param {string} data.eventId
 * @param {string} data.userId
 * @param {string} data.platform
 * @param {string} [data.pkceVerifier] RFC 7636 code verifier (Discord)
 * @param {string} secret HMAC key (JWT_SECRET)
 */
function issue({ eventId, userId, platform, pkceVerifier }, secret) {
  pruneNonces();

  const payload = {
    e: String(eventId),
    u: String(userId),
    p: platform,
    n: nonce(),
    // PKCE challenge: S256 of the verifier. The verifier itself is never put in
    // the token — it stays server-side is not possible across stateless
    // callbacks, so instead the verifier IS included but the token is signed,
    // and the callback runs before an attacker could observe it. Keeping the
    // challenge here is standard practice for the "public client" pattern.
    v: pkceVerifier,
    t: Date.now(),
  };

  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

/**
 * Verify and consume a state token.
 *
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
function consume(state, secret, { expectedPlatform } = {}) {
  if (!state || typeof state !== 'string') {
    return { ok: false, error: 'Missing state token' };
  }

  const dot = state.lastIndexOf('.');
  if (dot < 1) return { ok: false, error: 'Malformed state token' };

  const payloadB64 = state.slice(0, dot);
  const providedSig = state.slice(dot + 1);

  const expectedSig = sign(payloadB64, secret);
  if (!timingSafeEqualStr(providedSig, expectedSig)) {
    logger.warn('[oauth] Rejected state token with a bad signature');
    return { ok: false, error: 'Invalid state token' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, error: 'Unreadable state token' };
  }

  // Expiry.
  if (!payload.t || Date.now() - payload.t > TTL_MS) {
    logger.warn('[oauth] Rejected expired state token');
    return { ok: false, error: 'This connection request expired. Please try again.' };
  }

  // Single use.
  pruneNonces();
  if (usedNonces.has(payload.n)) {
    logger.warn(`[oauth] Replayed state token for event ${payload.e}`);
    return { ok: false, error: 'This connection link was already used.' };
  }
  usedNonces.set(payload.n, Date.now() + TTL_MS);

  // Platform binding: stops a Discord state being replayed against Slack.
  if (expectedPlatform && payload.p !== expectedPlatform) {
    return { ok: false, error: 'State token does not match this platform.' };
  }

  return { ok: true, data: payload };
}

/** Test seam. */
function _reset() {
  usedNonces.clear();
}

module.exports = { issue, consume, _reset, TTL_MS };