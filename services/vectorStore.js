const { QdrantClient } = require('@qdrant/js-client-rest');
const logger = require('../utils/logger');
const Sentry = require('@sentry/node');

/**
 * Shared Qdrant wrapper.
 *
 * Both the FAQ agent (search) and the learning agent (upsert) used to create
 * their own Qdrant clients with silent failure paths, which made a misconfigured
 * vector store indistinguishable from a genuine "no match" answer. All vector
 * operations now flow through here and surface failures loudly (logger + Sentry).
 */

const COLLECTION = 'faqs';

// Lazily-created singleton so a missing QDRANT_URL never throws at boot.
let client = null;
function getClient() {
  if (!client) {
    client = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
  }
  return client;
}

function assertVector(vector) {
  if (!Array.isArray(vector) || vector.length === 0) {
    const err = new Error('Vector operation attempted without a valid embedding vector');
    logger.error(`[vectorStore] ${err.message}`);
    Sentry.captureException(err);
    throw err;
  }
}

/**
 * Create the FAQ collection if it does not exist yet.
 * @returns {Promise<boolean>} true when the collection was created, false if it already existed
 */
async function ensureCollection(dimension) {
  const { collections } = await getClient().getCollections();
  if (collections.some((c) => c.name === COLLECTION)) return false;
  await getClient().createCollection(COLLECTION, {
    vectors: { size: dimension, distance: 'Cosine' },
  });
  logger.info(`[vectorStore] Created collection "${COLLECTION}" with ${dimension}-dim vectors`);
  return true;
}

/**
 * Semantic search over the event's FAQs.
 * Throws on failure — the caller decides how to respond, but the error is logged & captured.
 */
async function searchSimilar(eventId, vector, limit = 3) {
  assertVector(vector);
  try {
    return await getClient().search(COLLECTION, {
      vector,
      limit,
      filter: {
        must: [{ key: 'eventId', match: { value: String(eventId) } }],
      },
    });
  } catch (err) {
    logger.error(`[vectorStore] Qdrant search failed for event ${eventId}: ${err.message}`);
    Sentry.captureException(err);
    throw err;
  }
}

/**
 * Qdrant point IDs must be a UUID or uint64 — a MongoDB ObjectId hex string is
 * neither. Derive a stable, deterministic UUID from the FAQ's document id so
 * re-learning the same FAQ upserts the same point instead of duplicating it.
 */
function faqIdToUuid(faqId) {
  const hex = String(faqId).padStart(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Upsert a single FAQ point into the vector store (creating the collection
 * first if needed). Throws on failure.
 */
async function upsertFaq({ id, vector, payload = {} }) {
  assertVector(vector);
  try {
    await ensureCollection(vector.length);
    await getClient().upsert(COLLECTION, {
      wait: true,
      points: [{
        id: faqIdToUuid(id),
        vector,
        payload: { ...payload, faqId: String(id) },
      }],
    });
  } catch (err) {
    logger.error(`[vectorStore] Qdrant upsert failed for FAQ ${id}: ${err.message}`);
    Sentry.captureException(err);
    throw err;
  }
}

/**
 * Sync a Mongo FAQ document into the vector store, building the standard
 * payload. Non-throwing: a vector outage must never fail FAQ CRUD, but the
 * failure is logged and captured so it is never silent.
 * @returns {Promise<boolean>} true when the point was upserted
 */
async function syncFaqVector(faqDoc) {
  if (!faqDoc || !Array.isArray(faqDoc.embedding) || faqDoc.embedding.length === 0) {
    const err = new Error(`FAQ ${faqDoc?._id || '?'} has no embedding to sync`);
    logger.error(`[vectorStore] ${err.message}`);
    Sentry.captureException(err);
    return false;
  }
  try {
    await upsertFaq({
      id: faqDoc._id,
      vector: faqDoc.embedding,
      payload: {
        eventId: String(faqDoc.eventId),
        question: faqDoc.question,
        answer: faqDoc.answer,
        category: faqDoc.category,
        tags: faqDoc.tags,
        platforms: faqDoc.platforms,
      },
    });
    return true;
  } catch (err) {
    // upsertFaq already logged + captured; keep non-throwing.
    return false;
  }
}

/**
 * Remove a FAQ point from the vector store. Non-throwing (same rationale as
 * syncFaqVector).
 * @returns {Promise<boolean>} true when the point was deleted (or absent)
 */
async function deleteFaq(id) {
  try {
    await getClient().delete(COLLECTION, { points: [faqIdToUuid(id)], wait: true });
    return true;
  } catch (err) {
    logger.error(`[vectorStore] Qdrant delete failed for FAQ ${id}: ${err.message}`);
    Sentry.captureException(err);
    return false;
  }
}

/**
 * Non-throwing health diagnostics for the /health endpoint so a vector-DB
 * outage is visible without bringing the whole health check down.
 */
async function getHealth() {
  try {
    const { collections } = await getClient().getCollections();
    const faqCol = collections.find((c) => c.name === COLLECTION);
    const info = {
      status: faqCol ? 'ok' : 'uninitialized',
      collection: COLLECTION,
      exists: Boolean(faqCol),
    };
    if (faqCol) {
      if (faqCol.vectors) info.vectorSize = faqCol.vectors.size || faqCol.vectors.params?.size || null;
      try {
        const { count } = await getClient().count(COLLECTION, { exact: true });
        info.points = count;
      } catch {
        info.points = null;
      }
    }
    return info;
  } catch (err) {
    logger.error(`[vectorStore] Health check failed: ${err.message}`);
    return { status: 'error', collection: COLLECTION, exists: false, message: err.message };
  }
}

module.exports = { COLLECTION, getClient, ensureCollection, searchSimilar, upsertFaq, getHealth, faqIdToUuid, syncFaqVector, deleteFaq };