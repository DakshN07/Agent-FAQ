const axios = require('axios');
const BaseAdapter = require('./BaseAdapter');

class SlackAdapter extends BaseAdapter {
    constructor(eventId, config, credentials) {
        super(eventId, config, credentials);
        // credentials.token usually refers to Bot User OAuth Token (xoxb-...)
    }

    async init() {
        console.log(`[Event ${this.eventId}] Slack integration initialized (Webhook listener ready).`);
        // State-less initialization for Slack since it's webhook-driven, mostly just validating the token.
        try {
            const res = await axios.post('https://slack.com/api/auth.test', {}, {
                headers: { Authorization: `Bearer ${this.credentials.token}` }
            });
            if (!res.data.ok) {
                throw new Error(`Slack Auth Error: ${res.data.error}`);
            }
            console.log(`[Event ${this.eventId}] Slack Bot authenticated successfully as ${res.data.bot_id}`);
        } catch (error) {
            console.error(`[Event ${this.eventId}] Failed to init Slack config:`, error.message);
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
                }
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

        // Check if it's a message event
        if (payload.event && payload.event.type === 'message' && !payload.event.bot_id) {
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
