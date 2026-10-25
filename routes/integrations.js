const express = require('express');
const router = express.Router({ mergeParams: true });

const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const Faq = require('../models/Faq');
const Integration = require('../models/Integration');
const { authenticate } = require('../middleware/auth');
const integrationManager = require('../services/IntegrationManager');
const { readCredentials, toPublicJSON } = require('../services/integrationCredentials');
const faqImport = require('../services/faqImport');
const { getEmbedding } = require('../services/embedding');
const { resolveMistralKey } = require('../services/mistralKey');
const { syncFaqVector } = require('../services/vectorStore');
const logger = require('../utils/logger');

/**
 * Integration status & management.
 *
 * Read endpoints return a deliberately credential-free shape
 * (services/integrationCredentials.toPublicJSON) — bot tokens must never reach
 * a browser. Connections themselves are created via /api/oauth/:platform/connect
 * (which performs the provider redirect).
 */

// Only event managers (or admins) may configure channels.
const checkEventAdmin = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const isManager = event.managerId?.toString() === req.user.id.toString();
        if (isManager) return next();

        const membership = await EventMember.findOne({
            eventId: event._id,
            userId: req.user.id,
            status: 'Active',
            role: { $in: ['admin', 'owner', 'manager'] },
        }).catch(() => null);

        if (!membership) return res.status(403).json({ error: 'Access denied' });
        next();
    } catch (error) {
        next(error);
    }
};

/** Load the saved connection and decrypt its credentials, or fail clearly. */
const loadCredentials = async (eventId, platform) => {
    const integration = await Integration.findOne({ eventId, platform }).select('+encryptedCredentials');
    if (!integration) {
        throw Object.assign(new Error(`No ${platform} connection exists for this event.`), {
            statusCode: 409,
        });
    }
    const credentials = readCredentials(integration);
    if (!credentials?.token) {
        throw Object.assign(
            new Error(`This ${platform} connection has no usable token. Reconnect it first.`),
            { statusCode: 409 }
        );
    }
    return credentials;
};

/**
 * Reject an unsupported platform *before* looking up the connection, so the user
 * hears "Telegram can't do this" rather than a confusing "no telegram
 * connection exists" that implies connecting would help.
 */
const assertImportSupported = (platform) => {
    if (faqImport.supportsImport(platform)) return;
    throw Object.assign(new Error(faqImport.NOT_SUPPORTED[platform] || 'Import is not supported here.'), {
        statusCode: 400,
    });
};

// Read status for the dashboard's connect buttons.
router.get('/', authenticate, checkEventAdmin, async (req, res, next) => {
    try {
        res.json(await integrationManager.getStatus(req.params.eventId));
    } catch (error) {
        next(error);
    }
});

/**
 * Reconnect / retry. The credentials are already stored, so this only needs to
 * restart the adapter — it is what the dashboard's "Retry" button calls when a
 * connection was saved but the socket failed to open.
 */
router.post('/:platform/reconnect', authenticate, checkEventAdmin, async (req, res) => {
    const { platform } = req.params;
    const { eventId } = req.params;
    try {
        await integrationManager.stopIntegration(eventId, platform);
        await integrationManager.startIntegration({ eventId, platform });
        const status = await integrationManager.getStatus(eventId);
        res.json(status[platform]);
    } catch (error) {
        logger.error(`[integrations] Reconnect ${platform} failed: ${error.message}`);
        res.status(502).json({ error: 'Could not reconnect. The saved credentials may have been revoked.' });
    }
});

// ---------------------------------------------------------------------------
// FAQ import — pull existing Q&A out of a connected channel
// ---------------------------------------------------------------------------

/**
 * GET /api/events/:eventId/integrations/:platform/import-sources
 *
 * Channels the bot can read pins from, so the user can choose where to import
 * from rather than guessing a channel id.
 */
router.get('/:platform/import-sources', authenticate, checkEventAdmin, async (req, res, next) => {
    const { platform } = req.params;
    const { eventId } = req.params;
    try {
        assertImportSupported(platform);
        const credentials = await loadCredentials(eventId, platform);
        const sources = await faqImport.listSources(platform, credentials);
        res.json({ platform, sources });
    } catch (error) {
        // faqImport sets statusCode for "this can't work" cases; anything else
        // (a provider outage, a revoked token) surfaces as a 502.
        next(
            Object.assign(error, {
                statusCode: error.statusCode || 502,
            })
        );
    }
});

/**
 * POST /api/events/:eventId/integrations/:platform/import-faqs
 * Body: { sourceIds: string[], limit?: number }
 *
 * Extracts Q&A pairs and saves them as FAQs, embedding each question so the
 * imported content is immediately searchable.
 */
router.post('/:platform/import-faqs', authenticate, checkEventAdmin, async (req, res, next) => {
    const { platform } = req.params;
    const { eventId } = req.params;
    const { sourceIds, limit = 50 } = req.body || {};

    // An import is a bulk write; cap it so one request can't take the API down.
    const MAX_IMPORT = 100;
    const cap = Math.min(Math.max(Number(limit) || 50, 1), MAX_IMPORT);

    try {
        assertImportSupported(platform);
        const credentials = await loadCredentials(eventId, platform);
        const { pairs, skipped } = await faqImport.extractPairs(platform, credentials, sourceIds);

        if (pairs.length === 0) {
            return res.json({
                imported: 0,
                skipped,
                message:
                    'No pinned question-and-answer pairs were found in the selected channels. ' +
                    'Pinned messages need at least one reply to become an FAQ.',
            });
        }

        const selected = pairs.slice(0, cap);
        const truncated = pairs.length > selected.length;

        // Bill the embeddings to whoever started the import, same as manual FAQ
        // creation. A missing key is not fatal — the FAQ is still stored and
        // falls back to keyword matching until a key is available.
        const { key: mistralApiKey } = await resolveMistralKey({ userId: req.user.id });

        const created = [];
        const failed = [];

        // Sequential rather than parallel: Mistral rate-limits aggressively, and
        // a few dozen small embeddings is fast enough in series.
        for (const pair of selected) {
            try {
                const embedding = await getEmbedding(pair.question, { apiKey: mistralApiKey || undefined });

                const faq = await Faq.create({
                    eventId,
                    question: pair.question,
                    answer: pair.answer,
                    platforms: [platform],
                    embedding: embedding || undefined,
                });

                // Non-throwing: a Qdrant outage must not lose the imported FAQ.
                await syncFaqVector(faq).catch((err) =>
                    logger.warn(`[faqImport] Vector sync failed for imported FAQ: ${err.message}`)
                );

                created.push({ id: faq._id, question: faq.question });
            } catch (err) {
                failed.push({ question: pair.question, reason: err.message });
            }
        }

        logger.info(
            `[faqImport] ${platform} import for event ${eventId}: ${created.length} created, ` +
                `${skipped} skipped, ${failed.length} failed`
        );

        res.json({
            imported: created.length,
            skipped: skipped + (pairs.length - selected.length),
            failed: failed.length,
            truncated,
            faqs: created,
            message:
                `Imported ${created.length} question${created.length === 1 ? '' : 's'}` +
                (skipped ? `, skipped ${skipped} that weren't question-and-answer pairs` : '') +
                '.',
        });
    } catch (error) {
        next(Object.assign(error, { statusCode: error.statusCode || 502 }));
    }
});

module.exports = router;
