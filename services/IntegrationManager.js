const { EventEmitter } = require('events');
const Integration = require('../models/Integration');
const DiscordAdapter = require('../adapters/DiscordAdapter');
const SlackAdapter = require('../adapters/SlackAdapter');
const TelegramAdapter = require('../adapters/TelegramAdapter');
const Event = require('../models/Event');
const { cosineSimilarity } = require('../services/similarity');
const { normalizeThreshold } = require('../utils/threshold');
const { getSettings } = require('../utils/storage');
const { resolveMistralKey } = require('./mistralKey');
const { readCredentials, toPublicJSON } = require('./integrationCredentials');
const Faq = require('../models/Faq');
const UnknownQuestion = require('../models/UnknownQuestion');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');

class IntegrationManager extends EventEmitter {
    constructor() {
        super();
        // Map of running adapters: "eventId:platform" => AdapterInstance
        this.adapters = new Map();
        // Last runtime error per adapter, surfaced in the dashboard.
        this.errors = new Map();
    }

    async loadIntegrations() {
        console.log("🔄 Loading active integrations...");
        try {
            const activeIntegrations = await Integration.find({ isActive: true });
            for (const integration of activeIntegrations) {
                await this.startIntegration(integration);
            }
            logger.info(`[IntegrationManager] Restored ${this.adapters.size} channel connection(s)`);
        } catch (err) {
            console.error("Failed to load integrations", err);
        }
    }

    /**
     * Start (or restart) an integration's adapter.
     *
     * @param {object} integration Integration doc, or {eventId, platform}
     * @param {object} [opts] { userId } — used to resolve the owner's AI key
     */
    async startIntegration(integration, opts = {}) {
        const { eventId, platform } = integration;
        const key = `${eventId}:${platform}`;

        // Already running — nothing to do.
        if (this.adapters.has(key)) return;

        // Credentials are encrypted at rest; decrypt only now, at the moment we
        // hand them to the adapter.
        const full = integration.encryptedCredentials
            ? integration
            : await Integration.findOne({ eventId, platform }).select('+encryptedCredentials');

        const credentials = readCredentials(full);
        if (!credentials?.token) {
            const msg = `No usable ${platform} credentials for event ${eventId}`;
            this.errors.set(key, msg);
            logger.warn(`[IntegrationManager] ${msg}`);
            return;
        }

        let adapterInstance;
        switch (platform) {
            case 'discord':
                adapterInstance = new DiscordAdapter(
                    eventId, {},
                    credentials,
                    this.handleIncomingMessage.bind(this)
                );
                break;
            case 'slack':
                adapterInstance = new SlackAdapter(
                    eventId, {},
                    credentials,
                    this.handleIncomingMessage.bind(this)
                );
                break;
            case 'telegram':
                adapterInstance = new TelegramAdapter(
                    eventId, {},
                    credentials,
                    this.handleIncomingMessage.bind(this)
                );
                break;
            default:
                logger.warn(`[IntegrationManager] Unrecognized platform: ${platform}`);
                return;
        }

        try {
            await adapterInstance.init();

            // The adapter has its own credential handling; clear the decrypted
            // copy from the adapter's long-lived object so it isn't retained in
            // memory for the life of the process beyond what it needs.
            this.adapters.set(key, adapterInstance);
            this.errors.delete(key);
            logger.info(`[IntegrationManager] ${platform} connected for event ${eventId}`);
        } catch (err) {
            this.errors.set(key, err.message);
            logger.error(`[IntegrationManager] Failed starting ${key}: ${err.message}`);
            // Persist so the dashboard can show *why* it isn't connected,
            // instead of the user wondering why nothing happens.
            await Integration.updateOne({ eventId, platform }, { lastError: err.message }).catch(() => {});
            throw err;
        }
    }

    async stopIntegration(eventId, platform) {
        const key = `${eventId}:${platform}`;
        if (this.adapters.has(key)) {
            const adapter = this.adapters.get(key);
            await adapter.destroy();
            this.adapters.delete(key);
            logger.info(`[IntegrationManager] Stopped ${key}`);
        }
    }

    getAdapter(eventId, platform) {
        return this.adapters.get(`${eventId}:${platform}`);
    }

    /**
     * Per-platform connection state for the dashboard.
     * Never includes credential material.
     */
    async getStatus(eventId) {
        const integrations = await Integration.find({ eventId });
        const out = {};

        for (const platform of ['discord', 'slack', 'telegram', 'web']) {
            const record = integrations.find((i) => i.platform === platform);
            const key = `${eventId}:${platform}`;

            if (!record) {
                out[platform] = { connected: false, running: false };
                continue;
            }

            out[platform] = toPublicJSON(record, {
                // `running` is the honest signal: credentials can be saved while
                // the socket failed to open, and the user needs to see that.
                running: this.adapters.has(key),
                runtimeError: this.errors.get(key) || null,
            });
        }

        return out;
    }

    /**
     * Unified message handler across all platforms using LangGraph
     */
    async handleIncomingMessage(normalizedMsg) {
        const { eventId, sourcePlatform, channelId, userId, text } = normalizedMsg;
        console.log(`[${eventId}][${sourcePlatform}] Message from ${userId}: ${text}`);

        try {
            // 1. Log Conversation & Message
            const Conversation = require('../models/Conversation');
            const Message = require('../models/Message');

            let conversation = await Conversation.findOne({ eventId, channelId, platform: sourcePlatform });
            if (!conversation) {
                conversation = await Conversation.create({
                    eventId,
                    userId,
                    platform: sourcePlatform,
                    channelId,
                    status: 'Pending'
                });
            } else {
                conversation.lastMessageAt = Date.now();
                await conversation.save();
            }

            await Message.create({
                conversationId: conversation._id,
                text,
                senderType: 'User',
                senderId: userId
            });

            // Notify live (SSE) subscribers about the new/updated conversation
            // and the incoming user message.
            this.emit('conversation:upserted', { eventId, platform: sourcePlatform, conversation });
            this.emit('message:new', { eventId, platform: sourcePlatform, conversationId: conversation._id, message: { text } });

            // 2. Resolve the effective answering threshold.
            //    Explicit per-event faqThreshold beats the global setting, which
            //    beats the 0.85 default. The same value is passed into the
            //    workflow AND used for the Answered/Escalated decision so the
            //    configurable setting is never ignored.
            const [event, settings] = await Promise.all([
                Event.findById(eventId).lean().catch(() => null),
                getSettings().catch(() => null),
            ]);
            const faqThreshold = normalizeThreshold(event?.faqThreshold ?? settings?.similarityThreshold);

            // 3. Resolve the Mistral key. Channel messages arrive from Discord /
            //    Slack / Telegram end-users who have no account here, so bill the
            //    *event manager's* key (their org pays for their own bot), falling
            //    back to the deployment key.
            const { key: mistralApiKey } = await resolveMistralKey({
                userId: event?.managerId,
            }).catch(() => ({ key: null }));

            // 4. Invoke LangGraph Workflow
            const { createSupportWorkflow } = require('./langgraph/workflow');
            const workflow = createSupportWorkflow();

            const initialState = {
                messages: [{ role: 'user', content: text }],
                conversationId: conversation._id,
                userId,
                eventId,
                platform: sourcePlatform,
                nextAgent: null,
                isFlagged: false,
                confidenceScore: 0.0,
                finalAnswer: null,
                faqThreshold,
                mistralApiKey,
            };

            const finalState = await workflow.invoke(initialState);

            // 5. Handle Workflow Result
            let replyMessage = finalState.finalAnswer;

            if (finalState.isFlagged) {
                // Do not respond, or respond neutrally
                replyMessage = "I cannot process this request.";
                conversation.status = 'Spam';
            } else if (finalState.confidenceScore >= faqThreshold) {
                conversation.status = 'Answered';
            } else {
                conversation.status = 'Escalated';
            }
            await conversation.save();
            this.emit('conversation:upserted', { eventId, platform: sourcePlatform, conversation });

            // Save AI Message
            if (replyMessage) {
                await Message.create({
                    conversationId: conversation._id,
                    text: replyMessage,
                    senderType: 'Agent',
                    senderId: 'FAQ_Agent',
                    confidence: finalState.confidenceScore,
                    flags: finalState.isFlagged ? [finalState.toxicityType] : []
                });

                // Notify live (SSE) subscribers about the AI reply.
                this.emit('message:new', { eventId, platform: sourcePlatform, conversationId: conversation._id, message: { text: replyMessage, senderType: 'Agent' } });

                // Send back via adapter
                const adapter = this.getAdapter(eventId, sourcePlatform);
                if (adapter) {
                    await adapter.sendMessage(channelId, replyMessage);
                }
            }

            return { matched: finalState.confidenceScore >= faqThreshold, answer: replyMessage };

        } catch (err) {
            console.error("Error in LangGraph unified message handler:", err);
            return { matched: false, answer: "An error occurred while processing your message." };
        }
    }

}

// Create a singleton instance
module.exports = new IntegrationManager();