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
            case 'whatsapp':
                const WhatsappAdapter = require('../adapters/WhatsappAdapter');
                adapterInstance = new WhatsappAdapter(integration.eventId, {}, { ...integration.credentials }, this.handleIncomingMessage.bind(this));
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

            // 2. Invoke LangGraph Workflow
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
                finalAnswer: null
            };

            const finalState = await workflow.invoke(initialState);

            // 3. Handle Workflow Result
            let replyMessage = finalState.finalAnswer;
            
            if (finalState.isFlagged) {
                // Do not respond, or respond neutrally
                replyMessage = "I cannot process this request.";
                conversation.status = 'Spam';
            } else if (finalState.confidenceScore >= 0.85) {
                conversation.status = 'Answered';
            } else {
                conversation.status = 'Escalated';
            }
            await conversation.save();

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

                // Send back via adapter
                const adapter = this.getAdapter(eventId, sourcePlatform);
                if (adapter) {
                    await adapter.sendMessage(channelId, replyMessage);
                }
            }

            return { matched: finalState.confidenceScore >= 0.85, answer: replyMessage };

        } catch (err) {
            console.error("Error in LangGraph unified message handler:", err);
            return { matched: false, answer: "An error occurred while processing your message." };
        }
    }

}

// Create a singleton instance
module.exports = new IntegrationManager();
