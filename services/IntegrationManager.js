const Integration = require('../models/Integration');
const DiscordAdapter = require('../adapters/DiscordAdapter');
const SlackAdapter = require('../adapters/SlackAdapter');
const TelegramAdapter = require('../adapters/TelegramAdapter');
const { getEmbedding } = require('../services/embedding');
const { cosineSimilarity } = require('../services/similarity');
const Faq = require('../models/Faq');
const UnknownQuestion = require('../models/UnknownQuestion');
const Analytics = require('../models/Analytics');

class IntegrationManager {
    constructor() {
        // Map of active adapters: "eventId:platform" => AdapterInstance
        this.adapters = new Map();
    }

    async loadIntegrations() {
        console.log("🔄 Loading active integrations...");
        try {
            const activeIntegrations = await Integration.find({ isActive: true });
            for (const integration of activeIntegrations) {
                await this.startIntegration(integration);
            }
        } catch (err) {
            console.error("Failed to load integrations", err);
        }
    }

    async startIntegration(integration) {
        const key = `${integration.eventId}:${integration.platform}`;
        if (this.adapters.has(key)) {
            console.log(`[IntegrationManager] Integration ${key} is already running.`);
            return;
        }

        let adapterInstance;
        switch (integration.platform) {
            case 'discord':
                adapterInstance = new DiscordAdapter(integration.eventId, {}, { token: process.env.DISCORD_TOKEN, ...integration.credentials }, this.handleIncomingMessage.bind(this));
                break;
            case 'slack':
                adapterInstance = new SlackAdapter(integration.eventId, {}, { token: integration.credentials?.access_token || integration.credentials?.token });
                break;
            case 'telegram':
                adapterInstance = new TelegramAdapter(integration.eventId, {}, { token: process.env.TELEGRAM_BOT_TOKEN, ...integration.credentials }, this.handleIncomingMessage.bind(this));
                break;
            default:
                console.log(`[IntegrationManager] Unrecognized platform: ${integration.platform}`);
                return;
        }

        try {
            await adapterInstance.init();
            this.adapters.set(key, adapterInstance);
        } catch (err) {
            console.error(`[IntegrationManager] Failed starting ${key}:`, err.message);
        }
    }

    async stopIntegration(eventId, platform) {
        const key = `${eventId}:${platform}`;
        if (this.adapters.has(key)) {
            const adapter = this.adapters.get(key);
            await adapter.destroy();
            this.adapters.delete(key);
            console.log(`[IntegrationManager] Stopped ${key}`);
        }
    }

    getAdapter(eventId, platform) {
        return this.adapters.get(`${eventId}:${platform}`);
    }

    /**
     * Unified message handler across all platforms
     */
    async handleIncomingMessage(normalizedMsg) {
        const { eventId, sourcePlatform, channelId, userId, text } = normalizedMsg;
        console.log(`[${eventId}][${sourcePlatform}] Message from ${userId}: ${text}`);

        try {
            // 1. Log query attempt
            await Analytics.updateOne(
                { eventId, platform: sourcePlatform, date: new Date().setHours(0, 0, 0, 0) },
                { $inc: { totalQueries: 1, uniqueUsers: 0 } }, // For simplicity, we can do $addToSet uniqueUsers in a pre/post hook later
                { upsert: true }
            );

            // 2. Fetch FAQs for this Event and Platform
            const faqs = await Faq.find({ eventId, platforms: sourcePlatform });
            if (!faqs.length) {
                // If no FAQs for the event, we can't answer. Add direct to unknown.
                return await this.handleUnknown(normalizedMsg);
            }

            // 3. Match using similarity
            const userEmbedding = await getEmbedding(text);
            if (!userEmbedding) return;

            let bestMatch = null;
            let bestScore = 0.0;
            for (const faq of faqs) {
                if (!faq.embedding) continue;
                const score = cosineSimilarity(userEmbedding, faq.embedding);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = faq;
                }
            }

            // We'll use a standard threshold for now, or fetch from Event model
            const THRESHOLD = 0.85;

            if (bestScore >= THRESHOLD) {
                console.log(`[Match] score ${bestScore.toFixed(2)} for: "${bestMatch.question}"`);
                await Analytics.updateOne(
                    { eventId, platform: sourcePlatform, date: new Date().setHours(0, 0, 0, 0) },
                    { $inc: { matchedQueries: 1 } },
                    { upsert: true }
                );

                // Send back via adapter
                const adapter = this.getAdapter(eventId, sourcePlatform);
                if (adapter) {
                    await adapter.sendMessage(channelId, bestMatch.answer);
                }
                return;
            }

            // 4. Handle Unknown
            await this.handleUnknown(normalizedMsg);

        } catch (err) {
            console.error("Error in unified message handler:", err);
        }
    }

    async handleUnknown(normalizedMsg) {
        const { eventId, sourcePlatform, channelId, userId, text } = normalizedMsg;

        let unknownSession = await UnknownQuestion.findOne({ eventId, text });
        if (!unknownSession) {
            unknownSession = new UnknownQuestion({
                eventId,
                text,
                count: 1,
                sourcePlatform,
                channelId
            });
        } else {
            unknownSession.count += 1;
            unknownSession.lastAskedAt = Date.now();
            // Update the location to reply to the latest thread
            unknownSession.sourcePlatform = sourcePlatform;
            unknownSession.channelId = channelId;
        }
        await unknownSession.save();

        console.log(`[Unknown] Logged: "${text}" x${unknownSession.count}`);
        // Optional: Auto-reply to let them know it's being reviewed
        if (unknownSession.count === 1) { // Only first time to not spam
            const adapter = this.getAdapter(eventId, sourcePlatform);
            if (adapter) {
                // await adapter.sendMessage(channelId, "I'm not quite sure about that yet, but I've noted your question for the team.");
            }
        }
    }

}

// Create a singleton instance
module.exports = new IntegrationManager();
