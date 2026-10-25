const express = require('express');
const router = express.Router();
const axios = require('axios');

const Integration = require('../models/Integration');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const config = require('../config/env');
const logger = require('../utils/logger');
const oauthState = require('../services/oauthState');
const providers = require('../services/oauthProviders');
const { prepareForStorage, readCredentials } = require('../services/integrationCredentials');
const { authenticate } = require('../middleware/auth');

/**
 * Channel connection flows.
 *
 * Shape of the flow, which is deliberately the minimum number of redirects:
 *
 *   1. Dashboard calls POST /api/oauth/:platform/connect  (authenticated)
 *      -> we mint a signed, single-use state token and hand back the provider URL
 *   2. Browser redirects to the provider. The user picks their server/workspace
 *      and approves (this is the one permission/account-selection screen, and it
 *      belongs to the provider, not to us).
 *   3. Provider redirects to GET /api/oauth/:platform/callback
 *      -> we validate state, exchange the code, store credentials encrypted,
 *         start the adapter, and redirect back to the dashboard.
 *
 * So the user sees exactly one external screen and ends up back on our page.
 *
 * Security notes:
 *  - `state` is signed, short-lived and single-use (see services/oauthState.js).
 *    The old implementation passed a bare eventId, which let an attacker attach
 *    their own server to somebody else's event.
 *  - Discord uses PKCE.
 *  - Credentials are encrypted at rest and never returned to a browser.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const backendOrigin = (req) => `${req.protocol}://${req.get('host')}`;
const callbackUrl = (req, platform) => `${backendOrigin(req)}/api/oauth/${platform}/callback`;

/** Where to land the user after the provider round-trip. */
const returnTo = (params) => {
    const q = new URLSearchParams(params).toString();
    return `${FRONTEND_URL}/dashboard/integrations${q ? `?${q}` : ''}`;
};

/** Config readiness, so we fail with a clear message instead of a provider 400. */
const clientIdFor = (platform) =>
    platform === 'discord' ? process.env.DISCORD_CLIENT_ID : process.env.SLACK_CLIENT_ID;
const clientSecretFor = (platform) =>
    platform === 'discord' ? process.env.DISCORD_CLIENT_SECRET : process.env.SLACK_CLIENT_SECRET;

const configReady = (platform) =>
    Boolean(clientIdFor(platform) && clientSecretFor(platform));

/** The user must own (or manage) the event they are connecting a channel to. */
const assertEventManager = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) return { ok: false, status: 404, error: 'Event not found' };

    const isManager = event.managerId?.toString() === userId.toString();
    if (isManager) return { ok: true, event };

    const membership = await EventMember.findOne({
        eventId,
        userId,
        status: 'Active',
        role: { $in: ['admin', 'owner', 'manager'] },
    }).catch(() => null);

    if (!membership) return { ok: false, status: 403, error: 'You cannot manage this event' };
    return { ok: true, event };
};

/**
 * Persist a completed connection and bring the adapter online.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
const persistAndStart = async ({ eventId, userId, platform, credentials }) => {
    const { bundle, meta } = prepareForStorage(platform, credentials);
    if (!bundle) {
        return { ok: false, error: 'The provider did not return a usable token.' };
    }

    const existing = await Integration.findOne({ eventId, platform });

    if (existing) {
        existing.encryptedCredentials = bundle;
        existing.meta = { ...(existing.meta || {}), ...meta };
        existing.isActive = true;
        existing.connectedAt = new Date();
        existing.lastError = null;
        await existing.save();
    } else {
        await Integration.create({
            eventId,
            platform,
            encryptedCredentials: bundle,
            meta,
            isActive: true,
            connectedAt: new Date(),
        });
    }

    // Start the adapter so the bot is live immediately, with no restart.
    // A failure here is recorded on the integration instead of failing the
    // request: the credentials are valid, we just couldn't open a socket, and
    // the user should still see the connection as saved.
    try {
        const integrationManager = require('../services/IntegrationManager');
        await integrationManager.startIntegration({ eventId, platform }, { userId });
        return { ok: true };
    } catch (err) {
        logger.error(`[oauth] ${platform} connected but adapter failed to start: ${err.message}`);
        await Integration.updateOne({ eventId, platform }, { lastError: err.message });
        return { ok: true, warning: err.message };
    }
};

// ---------------------------------------------------------------------------
// Telegram — token-based, because Telegram has no bot OAuth
//
// These must be registered BEFORE the generic `/:platform/...` handlers below.
// Express matches in registration order, so a generic `POST /:platform/connect`
// declared first would swallow `POST /telegram/connect` and reject it as an
// unsupported platform.
//
// Telegram bots cannot be installed via OAuth; the flow is "create a bot with
// @BotFather, paste the token". We verify the token against getMe before saving,
// so a typo is caught immediately rather than as a silently dead bot.
// ---------------------------------------------------------------------------

/** POST /api/oauth/telegram/connect  Body: { eventId, token } */
router.post('/telegram/connect', authenticate, async (req, res) => {
    const { eventId, token } = req.body || {};

    if (!eventId) return res.status(400).json({ error: 'eventId is required' });
    if (typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ error: 'A bot token is required' });
    }

    const access = await assertEventManager(eventId, req.user.id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    // Telegram tokens look like "123456789:AAE...".
    if (!/^\d{6,}:[\w-]{20,}$/.test(token.trim())) {
        return res.status(400).json({
            error: "That doesn't look like a Telegram bot token.",
            hint: 'Copy it from @BotFather in Telegram.',
        });
    }

    try {
        // Verify the token and capture the bot's identity for the UI.
        const me = await axios.get(`https://api.telegram.org/bot${token.trim()}/getMe`, {
            timeout: 10000,
        });
        if (!me.data?.ok) {
            return res.status(400).json({ error: 'Telegram rejected that bot token.' });
        }

        const result = await persistAndStart({
            eventId,
            userId: req.user.id,
            platform: 'telegram',
            credentials: {
                token: token.trim(),
                botUsername: me.data.result.username,
                botId: String(me.data.result.id),
            },
        });

        if (!result.ok) throw new Error(result.error);

        res.json({ connected: true, botUsername: me.data.result.username });
    } catch (err) {
        logger.error(`[oauth] telegram connect failed: ${err.message}`);
        res.status(400).json({ error: 'Could not verify that bot token with Telegram.' });
    }
});

/** GET /api/oauth/telegram/status */
router.get('/telegram/status', authenticate, (req, res) => {
    res.json({
        platform: 'telegram',
        // Telegram needs no server-side app registration, so it's always
        // "ready"; the user still has to supply their own bot token.
        configured: true,
        usesOauth: false,
    });
});

/**
 * POST /api/oauth/telegram/verify
 * Confirms a token works *before* the user commits to it, so a typo is caught
 * at step 2 of the dialog rather than after saving.
 */
router.post('/telegram/verify', authenticate, async (req, res) => {
    const { token } = req.body || {};
    if (typeof token !== 'string' || !/^\d{6,}:[\w-]{20,}$/.test(token.trim())) {
        return res.status(400).json({ valid: false, error: "That doesn't look like a Telegram bot token." });
    }
    try {
        const me = await axios.get(`https://api.telegram.org/bot${token.trim()}/getMe`, { timeout: 10000 });
        res.json({
            valid: Boolean(me.data?.ok),
            botUsername: me.data?.result?.username || null,
        });
    } catch {
        res.json({ valid: false, error: 'Could not reach Telegram.' });
    }
});

/**
 * GET /api/oauth/telegram/callback
 *
 * The Telegram Login Widget verifies a *user*, not a bot, so this can never
 * produce a bot token. It is kept only so previously-saved links don't 404; the
 * user is sent back to the dashboard to paste their token.
 */
router.get('/telegram/callback', (req, res) => {
    res.redirect(returnTo({ connected: 'none', platform: 'telegram', reason: 'needs_bot_token' }));
});

// ---------------------------------------------------------------------------
// Step 1 — begin (authenticated, called by the dashboard)
// ---------------------------------------------------------------------------

/**
 * POST /api/oauth/:platform/connect
 * Body: { eventId }
 * -> { authorizeUrl }
 *
 * Kept as a POST (not a GET redirect) so it can carry the Authorization header.
 * A GET would have to put the access token in a query string, which leaks it
 * into browser history and provider logs.
 */
router.post('/:platform/connect', authenticate, async (req, res) => {
    const { platform } = req.params;
    const { eventId } = req.body || {};

    if (!providers.PLATFORMS[platform]) {
        return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }
    if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
    }
    if (!configReady(platform)) {
        const envNames =
            platform === 'discord' ? 'DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET' : 'SLACK_CLIENT_ID / SLACK_CLIENT_SECRET';
        return res.status(503).json({
            error: `${platform} connections aren't configured on this server yet.`,
            hint: `The operator needs to set ${envNames}.`,
            code: 'OAUTH_NOT_CONFIGURED',
        });
    }

    const access = await assertEventManager(eventId, req.user.id);
    if (!access.ok) {
        return res.status(access.status).json({ error: access.error });
    }

    // PKCE for Discord (RFC 7636).
    let verifier;
    let challenge;
    if (providers.PLATFORMS[platform].usePKCE) {
        verifier = providers.pkceVerifier();
        challenge = providers.pkceChallenge(verifier);
    }

    const state = oauthState.issue(
        { eventId, userId: req.user.id, platform, pkceVerifier: verifier },
        config.jwt.secret
    );

    const authorizeUrl = providers.buildAuthorizeUrl(platform, {
        clientId: clientIdFor(platform),
        redirectUri: callbackUrl(req, platform),
        state,
        codeChallenge: challenge,
    });

    res.json({ authorizeUrl });
});

/**
 * GET /api/oauth/:platform/status
 * Whether the server has credentials configured for this platform, so the UI
 * can disable the button with an explanation instead of failing on click.
 */
router.get('/:platform/status', authenticate, (req, res) => {
    const { platform } = req.params;
    if (!providers.PLATFORMS[platform]) {
        return res.status(404).json({ error: 'Unknown platform' });
    }
    res.json({
        platform,
        configured: configReady(platform),
        usesOauth: true,
    });
});

// ---------------------------------------------------------------------------
// Step 2 + 3 — provider callback
// ---------------------------------------------------------------------------

/**
 * GET /api/oauth/discord/callback
 * GET /api/oauth/slack/callback
 */
router.get('/:platform/callback', async (req, res) => {
    const { platform } = req.params;
    const { code, state, error } = req.query;

    if (!providers.PLATFORMS[platform]) {
        return res.redirect(returnTo({ connected: 'none', reason: `unsupported_${platform}` }));
    }

    // The user declined, or the provider reported an error.
    if (error) {
        logger.info(`[oauth] ${platform} connection declined: ${error}`);
        return res.redirect(
            returnTo({ connected: 'none', platform, reason: error === 'access_denied' ? 'declined' : 'provider_error' })
        );
    }

    // Verify + consume the state token. This is the CSRF / replay gate.
    const verified = oauthState.consume(state, config.jwt.secret, { expectedPlatform: platform });
    if (!verified.ok) {
        logger.warn(`[oauth] ${platform} callback rejected: ${verified.error}`);
        return res.redirect(returnTo({ connected: 'none', platform, reason: 'invalid_state' }));
    }

    const { e: eventId, u: userId, v: codeVerifier } = verified.data;

    // Re-check access: permissions may have changed mid-flow.
    const access = await assertEventManager(eventId, userId);
    if (!access.ok) {
        return res.redirect(returnTo({ connected: 'none', platform, reason: 'forbidden' }));
    }

    try {
        const credentials = await providers.exchangeCode(platform, {
            clientId: clientIdFor(platform),
            clientSecret: clientSecretFor(platform),
            code,
            redirectUri: callbackUrl(req, platform),
            codeVerifier,
        });

        const result = await persistAndStart({ eventId, userId, platform, credentials });
        if (!result.ok) throw new Error(result.error);

        logger.info(`[oauth] ${platform} connected to event ${eventId}`);
        res.redirect(returnTo({ connected: platform, ...(result.warning && { warning: 'adapter_degraded' }) }));
    } catch (err) {
        logger.error(`[oauth] ${platform} callback failed: ${err.message}`, {
            detail: err.response?.data,
        });
        res.redirect(returnTo({ connected: 'none', platform, reason: 'exchange_failed' }));
    }
});

// ---------------------------------------------------------------------------
// Telegram — token-based, because Telegram has no bot OAuth
//
// NOTE: these routes are registered at the top of this file, before the generic
// `/:platform/...` handlers. Express matches in registration order, so a
// generic `POST /:platform/connect` declared first would swallow
// `POST /telegram/connect` and reject it as an unsupported platform.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------

/**
 * DELETE /api/oauth/:platform/disconnect   Body: { eventId }
 */
router.delete('/:platform/disconnect', authenticate, async (req, res) => {
    const { platform } = req.params;
    const { eventId } = req.body || {};

    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const access = await assertEventManager(eventId, req.user.id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    // Stop the running adapter first so it can't keep answering.
    try {
        const integrationManager = require('../services/IntegrationManager');
        await integrationManager.stopIntegration(eventId, platform);
    } catch (err) {
        logger.warn(`[oauth] Error stopping ${platform} adapter: ${err.message}`);
    }

    // Delete rather than deactivate: the encrypted token has no reason to linger.
    await Integration.deleteOne({ eventId, platform });

    res.json({ disconnected: true, platform });
});

module.exports = router;

// Exported for tests.
module.exports._internals = { persistAndStart, assertEventManager, returnTo };