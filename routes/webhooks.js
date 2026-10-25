const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const integrationManager = require('../services/IntegrationManager');
const Integration = require('../models/Integration');
const logger = require('../utils/logger');

/**
 * Slack inbound webhook (Events API).
 *
 * Slack signs every request with the app's signing secret and puts the result
 * in `x-slack-signature`, with the timestamp in `x-slack-request-timestamp`.
 * Verifying it is mandatory: without it, anyone who learns this URL could post
 * fake messages and drive the bot (and its AI budget) at will.
 */

// Reject timestamps far from now to block replay of a captured valid request.
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

function verifySlackSignature(rawBody, timestamp, signature, signingSecret) {
    if (!timestamp || !signature || !signingSecret) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() - ts * 1000) > MAX_TIMESTAMP_SKEW_MS) return false;

  // Slack signs "v0:{timestamp}:{raw_body}" — the RAW body, so this only works
  // with the verify() body-parser mounted for this route (see server.js notes).
  const base = `v0:${timestamp}:${rawBody}`;
  const expected =
    'v0=' +
    crypto.createHmac('sha256', signingSecret).update(base).digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// POST /api/webhooks/slack/:eventId
router.post('/slack/:eventId', async (req, res) => {
    const eventId = req.params.eventId;

    // Slack's URL verification handshake arrives before any secret is attached
    // to the request body in some install flows; respond so setup can proceed.
    if (req.body?.type === 'url_verification') {
        return res.json({ challenge: req.body.challenge });
    }

    const integration = await Integration.findOne({ eventId, platform: 'slack' }).select('+encryptedCredentials');

    // Signing secret comes from env; if unset we cannot verify, and accepting
    // unverified webhooks is worse than not accepting them at all.
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
        logger.error('[webhooks/slack] SLACK_SIGNING_SECRET is not set — rejecting webhook.');
        return res.status(503).send('Slack signature verification is not configured');
    }

    const rawBody = Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : JSON.stringify(req.body || {});

    const valid = verifySlackSignature(
        rawBody,
        req.get('x-slack-request-timestamp'),
        req.get('x-slack-signature'),
        signingSecret
    );

    if (!valid) {
        logger.warn(`[webhooks/slack] Rejected unsigned/invalid request for event ${eventId}`);
        return res.status(401).send('invalid signature');
    }

    // Slack requires an ACK within 3 seconds, so acknowledge first and process
    // asynchronously.
    res.status(200).send('OK');

    try {
        const adapter = integrationManager.getAdapter(eventId, 'slack');
        if (!adapter) {
            logger.warn(`[webhooks/slack] No running adapter for event ${eventId}`);
            return;
        }

        const normalizedMsg = adapter.parseWebhook(req.body);
        if (normalizedMsg) {
            await integrationManager.handleIncomingMessage(normalizedMsg);
        }
    } catch (error) {
        logger.error(`[webhooks/slack] Processing error: ${error.message}`);
    }
});

module.exports = router;
module.exports.verifySlackSignature = verifySlackSignature;