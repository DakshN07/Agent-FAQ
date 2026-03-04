/**
 * BasePlatformAdapter
 * Defines the standard interface for external platform integrations.
 */
class BaseAdapter {
    constructor(eventId, config, credentials) {
        this.eventId = eventId;
        this.config = config;
        this.credentials = credentials;
    }

    /**
     * Initializes the adapter (e.g., logging in a bot, setting up webhooks)
     */
    async init() {
        throw new Error('init() must be implemented by subclass');
    }

    /**
     * Stops or destroys the adapter connection (if stateful)
     */
    async destroy() {
        // Optional implementation
    }

    /**
     * Sends a message to a specific channel/user on the platform
     * @param {string} destinationId (channel ID, user ID, phone number)
     * @param {string} text Message content
     */
    async sendMessage(destinationId, text) {
        throw new Error('sendMessage() must be implemented by subclass');
    }

    /**
     * Parses an incoming webhook payload into a normalized format
     * @param {object} payload Raw webhook body
     * @returns {object} { sourcePlatform, channelId, userId, text, originalPayload }
     */
    parseWebhook(payload) {
        throw new Error('parseWebhook() must be implemented by subclass');
    }
}

module.exports = BaseAdapter;
