const { encrypt, decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * Integration credential handling.
 *
 * Channel credentials (Discord bot tokens, Slack bot tokens, webhook URLs) are
 * long-lived, full-account secrets. Storing them as plaintext in Mongo means a
 * DB dump, a stray log line, or an over-broad `select()` hands over the ability
 * to post as the customer's bot.
 *
 * Everything is encrypted at rest with AES-256-GCM (same helper as the Mistral
 * key) and only decrypted at the moment an adapter is constructed.
 */

/**
 * Which credential fields each adapter actually needs. Used to strip the rest
 * before storage — Discord's OAuth response contains an `integration_type`,
 * guild metadata, and other fields we never need to persist.
 */
const CREDENTIAL_FIELDS = {
  discord: ['token', 'guildId', 'guildName'],
  slack: ['token', 'teamId', 'teamName', 'botUserId', 'appId'],
  telegram: ['token', 'botUsername', 'botId'],
  web: [],
};

/**
 * Normalise + encrypt the credentials for storage.
 * @returns {{ bundle: object|null, meta: object }} the encrypted bundle and
 *   the non-secret display metadata (names shown in the UI).
 */
function prepareForStorage(platform, credentials = {}) {
  const fields = CREDENTIAL_FIELDS[platform] || [];
  const kept = {};

  for (const field of fields) {
    if (credentials[field] !== undefined && credentials[field] !== null && credentials[field] !== '') {
      kept[field] = credentials[field];
    }
  }

  // Slack's OAuth response nests the token under access_token.
  if (platform === 'slack' && !kept.token && credentials.access_token) {
    kept.token = credentials.access_token;
  }
  // Discord's token response nests it under access_token too.
  if (platform === 'discord' && !kept.token && credentials.access_token) {
    kept.token = credentials.access_token;
  }

  const meta = {
    // Friendly identifiers for the UI. Never the token itself.
    label:
      platform === 'discord' ? kept.guildName || kept.guildId
      : platform === 'slack' ? kept.teamName || kept.teamId
      : platform === 'telegram' ? kept.botUsername || kept.botId
      : null,
  };

  const hasSecret = Boolean(kept.token);
  return {
    bundle: hasSecret ? encrypt(JSON.stringify(kept)) : null,
    meta,
  };
}

/**
 * Decrypt an integration's credentials for adapter construction.
 * @returns {object|null} null when absent or undecryptable
 */
function readCredentials(integration) {
  const bundle = integration?.encryptedCredentials;
  if (!bundle?.ciphertext) return null;

  const json = decrypt(bundle);
  if (!json) {
    logger.error(
      `[integrations] Could not decrypt credentials for ${integration.platform} ` +
      `(event ${integration.eventId}). Was JWT_SECRET rotated?`
    );
    return null;
  }

  try {
    return JSON.parse(json);
  } catch (err) {
    logger.error(`[integrations] Corrupt credential bundle: ${err.message}`);
    return null;
  }
}

/**
 * The shape safe to send to a browser: never any credential material.
 */
function toPublicJSON(integration, runtime = {}) {
  return {
    platform: integration.platform,
    isActive: integration.isActive,
    label: integration.meta?.label || null,
    connectedAt: integration.connectedAt || integration.createdAt,
    lastError: integration.lastError || null,
    ...runtime,
  };
}

module.exports = { prepareForStorage, readCredentials, toPublicJSON, CREDENTIAL_FIELDS };