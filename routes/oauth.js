const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Integration = require('../models/Integration');
const Event = require('../models/Event');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper to save integration securely mapped to event
const saveIntegration = async (eventId, platform, credentials) => {
    try {
        let integration = await Integration.findOne({ eventId, platform });
        if (integration) {
            integration.credentials = credentials;
            integration.isActive = true;
        } else {
            integration = new Integration({ eventId, platform, credentials, isActive: true });
        }
        await integration.save();
        
        // Immediately start the adapter without requiring a server restart
        const integrationManager = require('../services/IntegrationManager');
        await integrationManager.startIntegration(integration);
        
        return true;
    } catch (e) {
        console.error("Integration Save Error:", e);
        return false;
    }
};

// Forwarder to Slack Authorization Page
router.get('/slack', (req, res) => {
    const { state } = req.query; // eventId
    const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:3000'}/api/oauth/slack/callback`;
    const url = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,chat:write.public&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    res.redirect(url);
});

// 1. Slack OAuth Callback
// User installs app -> Slack redirects here with code and state (eventId)
router.get('/slack/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`${FRONTEND_URL}/events/${state}/integrations?error=slack_denied`);
    if (!code || !state) return res.status(400).send('Missing code or state (eventId)');

    try {
        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code
            }
        });

        const data = response.data;
        if (!data.ok) throw new Error(data.error);

        // data.incoming_webhook.url is often what you need, or data.access_token for bot messaging
        await saveIntegration(state, 'slack', data);

        res.redirect(`${FRONTEND_URL}/dashboard?connect=success&platform=slack`);
    } catch (err) {
        console.error("Slack OAuth Error:", err.response?.data || err.message);
        res.redirect(`${FRONTEND_URL}/dashboard?connect=error&platform=slack`);
    }
});

// Forwarder to Discord Authorization Page
router.get('/discord', (req, res) => {
    const { state } = req.query; // eventId
    const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:3000'}/api/oauth/discord/callback`;
    const url = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&integration_type=0&scope=bot&state=${state}`;
    res.redirect(url);
});

// 2. Discord OAuth Callback
router.get('/discord/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`${FRONTEND_URL}/dashboard?connect=error&platform=discord`);
    if (!code || !state) return res.status(400).send('Missing code or state');

    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.DISCORD_CLIENT_ID);
        params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        // Ensure redirect_uri accurately matches what you entered in Discord Dev Portal
        params.append('redirect_uri', `${process.env.VITE_API_URL || 'http://localhost:3000'}/api/oauth/discord/callback`);

        const response = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // The discord oauth flow for bots usually includes guild (server) metadata embedded in the response if the bot scope was selected.
        await saveIntegration(state, 'discord', response.data);

        res.redirect(`${FRONTEND_URL}/dashboard?connect=success&platform=discord`);
    } catch (err) {
        console.error("Discord OAuth Error:", err.response?.data || err.message);
        res.redirect(`${FRONTEND_URL}/dashboard?connect=error&platform=discord`);
    }
});

// 3. Telegram Login Widget Callback
// Telegram redirects here with data verifyable by HMAC-SHA256
router.get('/telegram/callback', async (req, res) => {
    // The Telegram widget returns these query params: id, first_name, username, photo_url, auth_date, hash, state (custom)
    const data = Object.assign({}, req.query);
    const hash = data.hash;
    const eventId = data.state;
    delete data.hash; // Remove hash to construct the check string
    delete data.state; // State is custom for eventId, remove from check param

    if (!hash || !eventId) return res.status(400).send('Missing hash or state');

    // Verification algorithm
    const secret = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN || '').digest();
    const checkString = Object.keys(data)
        .sort()
        .map(k => `${k}=${data[k]}`)
        .join('\n');
    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

    if (hmac !== hash) {
        return res.status(401).send('Data is NOT from Telegram');
    }

    try {
        // If correct, data.id is the user's Telegram Chat ID, useful for DMing them.
        await saveIntegration(eventId, 'telegram', data);
        res.redirect(`${FRONTEND_URL}/dashboard?connect=success&platform=telegram`);
    } catch (error) {
        console.error("Telegram callback error:", error);
        res.redirect(`${FRONTEND_URL}/dashboard?connect=error&platform=telegram`);
    }
});

module.exports = router;
