const crypto = require('crypto');
const config = require('../config/env');

/**
 * Symmetric encryption for secrets we store on behalf of the user
 * (currently the bring-your-own Mistral API key).
 *
 * AES-256-GCM gives us confidentiality + integrity. The key is derived from
 * JWT_SECRET with scrypt so we never store raw key material ourselves.
 *
 * Why encrypt at all: a user's Mistral key is a billable credential. Storing it
 * in plaintext would mean a single DB leak (or a careless `select('+')`) hands
 * over paid API access for that account.
 */

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit nonce, the GCM-recommended size
const KEY_BYTES = 32; // 256-bit

// Derive once per process — scrypt is intentionally slow, so this must not run
// on every encrypt/decrypt call.
let derivedKey = null;
function getKey() {
  if (!derivedKey) {
    derivedKey = crypto.scryptSync(config.jwt.secret, 'agent-faq:secret-encryption:v1', KEY_BYTES);
  }
  return derivedKey;
}

/**
 * @param {string} plaintext
 * @returns {{ ciphertext: string, iv: string, tag: string }} hex-encoded bundle
 */
function encrypt(plaintext) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encrypt() requires a non-empty string');
  }
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * @param {{ ciphertext: string, iv: string, tag: string }} bundle
 * @returns {string|null} the plaintext, or null when the bundle is
 *   malformed / was tampered with (wrong key or corrupted GCM tag).
 */
function decrypt(bundle) {
  if (!bundle || !bundle.ciphertext || !bundle.iv || !bundle.tag) return null;
  try {
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(bundle.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(bundle.tag, 'hex'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(bundle.ciphertext, 'hex')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch {
    // Wrong key, or the ciphertext/iv/tag was altered. Treat as "no key".
    return null;
  }
}

module.exports = { encrypt, decrypt };