const { Client, GatewayIntentBits } = require('discord.js');
const BaseAdapter = require('./BaseAdapter');
// If needed, we can import centralized event emitter or message handler to pass received messages back to the core system.

class DiscordAdapter extends BaseAdapter {
    constructor(eventId, config, credentials, onMessageReceive) {
        super(eventId, config, credentials);
        // onMessageReceive is a callback: async (normalizedMessage) => {}
        this.onMessageReceive = onMessageReceive;

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
            partials: ['CHANNEL'],
        });
    }

    async init() {
        try {
            this.client.on('ready', () => {
                console.log(`[Event ${this.eventId}] Discord Bot Online as ${this.client.user.tag}`);
            });

            this.client.on('messageCreate', async (message) => {
                // Ignore self and other bots
                if (message.author.bot) return;

                // Normalizing message
                const normalizedMsg = {
                    eventId: this.eventId,
                    sourcePlatform: 'discord',
                    channelId: message.channel.id,
                    userId: message.author.id,
                    text: message.content.trim(),
                    originalPayload: message,
                    guildId: message.guild ? message.guild.id : null,
                    isDM: message.channel.type === 1
                };

                if (this.onMessageReceive) {
                    await this.onMessageReceive(normalizedMsg);
                }
            });

            const botToken = process.env.DISCORD_TOKEN || this.credentials.token;
            await this.client.login(botToken);
        } catch (err) {
            console.error(`[Event ${this.eventId}] Failed to init Discord config: ${err.message}`);
            throw err;
        }
    }

    async destroy() {
        if (this.client) {
            this.client.destroy();
            console.log(`[Event ${this.eventId}] Discord Client Destroyed.`);
        }
    }

    async sendMessage(destinationId, text) {
        try {
            // destinationId could be channelId or userId
            const channel = await this.client.channels.fetch(destinationId);
            if (channel) {
                await channel.send(text);
            } else {
                const user = await this.client.users.fetch(destinationId);
                if (user) {
                    await user.send(text);
                }
            }
        } catch (err) {
            console.error(`[Event ${this.eventId}] Discord send error: ${err.message}`);
        }
    }

    parseWebhook(payload) {
        // Discord typically doesn't use webhooks to SEND messages to OUR backend (we use discord.js client)
        // We can just return null or implement if we ever switch to Discord interactions API.
        return null;
    }
}

module.exports = DiscordAdapter;
