const axios = require('axios');
const BaseAdapter = require('./BaseAdapter');
const logger = require('../utils/logger');

/**
 * Slack adapter.
 *
 * Slack is webhook-driven for *inbound* messages (the Events API pushes to us)
 * and token-driven for *outbound* (chat.postMessage). The webhook receiver in
 * routes/webhooks.js authenticates the request with the signing secret and then
 * hands the payload to parseWebhook(); replies go back out through the bot token
 * obtained at connection time.
 */
class SlackAdapter extends BaseAdapter {
    constructor(eventId, config, credentials, onMessageReceive) {
        super(eventId, config, credentials);
        // credentials.token is the Bot User OAuth Token (xoxb-...)
        this.onMessageReceive = onMessageReceive;
    }

    async init() {
        // Validate the token immediately. A revoked token should surface as a
        // clear error at connection time, not as silence in a channel later.
        try {
            const res = await axios.post('https://slack.com/api/auth.test', {}, {
                headers: { Authorization: `Bearer ${this.credentials.token}` },
                timeout: 10000,
            });
            if (!res.data.ok) {
                throw new Error(`Slack auth failed: ${res.data.error}`);
            }
            logger.info?.(`[Event ${this.eventId}] Slack connected as ${res.data.user || res.data.team}`);
        } catch (error) {
            // Re-throw: the caller records this as lastError so the dashboard can
            // tell the user their token is no longer valid.
            throw error;
        }
    }

    async sendMessage(destinationId, text) {
        try {
            const response = await axios.post('https://slack.com/api/chat.postMessage', {
                channel: destinationId,
                text: text
            }, {
                headers: {
                    Authorization: `Bearer ${this.credentials.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000,
            });
            if (!response.data.ok) {
                console.error(`[Event ${this.eventId}] Slack send error: ${response.data.error}`);
            }
        } catch (err) {
            console.error(`[Event ${this.eventId}] Slack API error: ${err.message}`);
        }
    }

    parseWebhook(payload) {
        // Handle Slack Events API
        if (payload.type === 'url_verification') {
            return { type: 'challenge', challenge: payload.challenge }; // For Slack setup
        }

        // Ignore anything that isn't an inbound user message: bot echoes,
        // edits, deletions, joins, and our own replies (which have bot_id).
        if (payload.event && payload.event.type === 'message' && !payload.event.bot_id && !payload.event.subtype) {
            return {
                eventId: this.eventId,
                sourcePlatform: 'slack',
                channelId: payload.event.channel,
                userId: payload.event.user,
                text: payload.event.text,
                originalPayload: payload
            };
        }

        return null; // Ignore other events
    }
}

module.exports = SlackAdapter;