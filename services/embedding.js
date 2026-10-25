const { MistralAIEmbeddings } = require('@langchain/mistralai');
const { envKey } = require('./mistralKey');
const logger = require('../utils/logger');

/**
 * Embedding generation.
 *
 * The key is resolved per call so that a user who brought their own Mistral
 * key gets embeddings billed to their own account. When no key is passed we
 * fall back to the deployment-wide MISTRAL_API_KEY.
 *
 * Clients are cached by a SHA-256 of the key: constructing a client is cheap
 * but not free, and we do NOT want the raw key sitting in a Map key that could
 * end up in a log or error message.
 */

const crypto = require('crypto');

const clientCache = new Map();
const CACHE_LIMIT = 50;

const cacheId = (key) => crypto.createHash('sha256').update(key).digest('hex');

function getEmbeddingsClient(apiKey) {
  const key = apiKey || envKey();
  if (!key) return null;

  const id = cacheId(key);
  const cached = clientCache.get(id);
  if (cached) return cached;

  const client = new MistralAIEmbeddings({ apiKey: key, modelName: 'mistral-embed' });

  // Simple bound-growth eviction. Losing an entry only costs a rebuild.
  if (clientCache.size >= CACHE_LIMIT) {
    clientCache.delete(clientCache.keys().next().value);
  }
  clientCache.set(id, client);
  return client;
}

/**
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.apiKey] per-user Mistral key (falls back to env)
 * @returns {Promise<number[]|null>} the vector, or null if unavailable
 */
async function getEmbedding(text, { apiKey } = {}) {
  const embeddingsModel = getEmbeddingsClient(apiKey);
  if (!embeddingsModel) {
    logger.warn('⚠️ Attempted to generate an embedding without a Mistral API key. Add one in Settings.');
    return null;
  }

  try {
    return await embeddingsModel.embedQuery(text);
  } catch (error) {
    // 401/403 = the key itself is bad. Log it loudly: this is a configuration
    // problem, not a "no similar FAQ" result, and the two are easy to confuse.
    const status = error?.status ?? error?.response?.status;
    if (status === 401 || status === 403) {
      logger.error('❌ Mistral rejected the API key (401/403). Re-check the key in Settings.');
    } else {
      logger.error(`❌ Error generating embedding: ${error.message}`);
    }
    return null;
  }
}

module.exports = { getEmbedding };