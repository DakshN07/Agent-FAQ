const logger = require('../utils/logger');

/**
 * Mistral API key resolution.
 *
 * Agent-FAQ is "bring your own key": each user pastes their own Mistral API key
 * during onboarding (see frontend `MistralKeyStep`), we verify it against
 * Mistral once, then store it encrypted (AES-256-GCM, see utils/crypto.js).
 *
 * Resolution order for any AI call:
 *   1. The key stored on the acting user (decrypted on demand)
 *   2. The deployment-wide MISTRAL_API_KEY from the environment
 *
 * The env fallback keeps a single shared key working for self-hosting, local
 * dev, and CI, so the app is usable before anyone completes onboarding.
 */

// Mistral keys are opaque strings. We only enforce a sane shape and length —
// the authoritative check is the live verification call.
const KEY_SHAPE = /^[A-Za-z0-9_-]{16,}$/;

const PLACEHOLDERS = new Set([
  'your_mistral_api_key',
  'your-mistral-api-key',
  'changeme',
  'none',
  'null',
  'undefined',
]);

/**
 * Is this string a usable Mistral key by shape alone?
 * Rejects the `.env.example` placeholder and other obvious filler.
 */
function isPlausibleKey(key) {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (PLACEHOLDERS.has(trimmed.toLowerCase())) return false;
  return KEY_SHAPE.test(trimmed);
}

/** Last 4 chars of a key, safe to show in the UI so a user can tell keys apart. */
function maskKey(key) {
  if (typeof key !== 'string' || key.length <= 4) return null;
  return `••••${key.slice(-4)}`;
}

/**
 * The deployment-wide fallback key, or null when unset/unusable.
 */
function envKey() {
  const raw = process.env.MISTRAL_API_KEY;
  return isPlausibleKey(raw) ? raw.trim() : null;
}

/**
 * Verify a key against Mistral's API with a tiny, cheap request.
 * This is what makes "save my key" trustworthy instead of optimistic.
 *
 * @param {string} apiKey
 * @returns {Promise<{ ok: boolean, error?: string, status?: number }>}
 */
async function verifyKey(apiKey) {
  if (!isPlausibleKey(apiKey)) {
    return { ok: false, error: 'That does not look like a Mistral API key.' };
  }

  // "mistral-tiny" on a one-character prompt is the cheapest billable call that
  // still proves the key is real, active, and has credit.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
    });

    if (res.ok) return { ok: true };

    const status = res.status;
    if (status === 401 || status === 403) {
      return { ok: false, status, error: 'Mistral rejected this key. Check you copied the whole thing.' };
    }
    if (status === 429) {
      return { ok: false, status, error: 'This Mistral account has no credit left, or hit its rate limit.' };
    }
    return { ok: false, status, error: `Mistral returned an unexpected error (HTTP ${status}).` };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Mistral took too long to respond. Try again.' };
    }
    return { ok: false, error: `Could not reach Mistral: ${err.message}` };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve the Mistral key to use for a request.
 *
 * @param {object} [opts]
 * @param {string} [opts.userId] acting user — their stored key wins
 * @param {import('mongoose').Document} [opts.user] already-loaded user doc
 * @returns {Promise<{ key: string|null, source: 'user'|'env'|'none' }>}
 */
async function resolveMistralKey({ userId, user } = {}) {
  let doc = user;

  if (!doc && userId) {
    try {
      const User = require('../models/User');
      doc = await User.findById(userId).select('mistralApiKey');
    } catch (err) {
      logger.error(`[mistralKey] Failed to load key for user ${userId}: ${err.message}`);
    }
  }

  if (doc && doc.mistralApiKey && doc.mistralApiKey.ciphertext) {
    const { decrypt } = require('../utils/crypto');
    const plaintext = decrypt(doc.mistralApiKey);
    if (plaintext && isPlausibleKey(plaintext)) {
      return { key: plaintext, source: 'user' };
    }
    logger.warn(`[mistralKey] Stored key for user ${doc._id} could not be decrypted; falling back to env.`);
  }

  const fallback = envKey();
  return fallback ? { key: fallback, source: 'env' } : { key: null, source: 'none' };
}

module.exports = { isPlausibleKey, maskKey, envKey, verifyKey, resolveMistralKey };