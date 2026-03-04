const { Telegraf } = require('telegraf');
const BaseAdapter = require('./BaseAdapter');

class TelegramAdapter extends BaseAdapter {
    constructor(eventId, config, credentials, onMessageReceive) {
        super(eventId, config, credentials);
        // credentials.token is the Telegram Bot Token (e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)
        this.onMessageReceive = onMessageReceive;
        this.bot = null;
    }

    async init() {
        try {
            this.bot = new Telegraf(this.credentials.token);

            this.bot.on('message', async (ctx) => {
                // Ignore messages without text (like stickers, photos, unless we support them later)
                if (!ctx.message || !ctx.message.text) return;

                // Ignore commands for now (messages starting with /)
                if (ctx.message.text.startsWith('/')) return;

                const normalizedMsg = {
                    eventId: this.eventId,
                    sourcePlatform: 'telegram',
                    // Telegram uses chatId to send messages back
                    channelId: ctx.chat.id.toString(),
                    userId: ctx.from.id.toString(),
                    text: ctx.message.text.trim(),
                    originalPayload: ctx.message
                };

                if (this.onMessageReceive) {
                    await this.onMessageReceive(normalizedMsg);
                }
            });

            // Launch the bot (Long polling by default, can be configured for webhooks)
            this.bot.launch();
            console.log(`[Event ${this.eventId}] Telegram Bot Online.`);

            // Enable graceful stop
            process.once('SIGINT', () => { if (this.bot) this.bot.stop('SIGINT') });
            process.once('SIGTERM', () => { if (this.bot) this.bot.stop('SIGTERM') });

        } catch (err) {
            console.error(`[Event ${this.eventId}] Failed to init Telegram config: ${err.message}`);
            throw err;
        }
    }

    async destroy() {
        if (this.bot) {
            this.bot.stop('Shutdown');
            console.log(`[Event ${this.eventId}] Telegram Client Destroyed.`);
        }
    }

    async sendMessage(destinationId, text) {
        try {
            if (this.bot) {
                // destinationId corresponds to Telegram chatId
                await this.bot.telegram.sendMessage(destinationId, text);
            }
        } catch (err) {
            console.error(`[Event ${this.eventId}] Telegram send error: ${err.message}`);
        }
    }

    parseWebhook(payload) {
        // Telegraf handles webhooks internally if we use bot.handleUpdate(payload).
        // For now, launch() uses long-polling which is simpler to set up without exposing a public URL.
        return null;
    }
}

module.exports = TelegramAdapter;
