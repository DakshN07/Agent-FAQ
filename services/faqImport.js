const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Import existing Q&A from a connected channel.
 *
 * The goal is to let someone who already has their answers written down in
 * Discord or Slack get them into the FAQ bot without retyping everything.
 *
 * What we can honestly read, per platform:
 *
 *   Discord  — the bot can list the guild's channels and read pinned messages
 *              (and the message a pin replies to). This is the richest source.
 *   Slack    — `conversations.list` and `pins.list` with the `channels:read`
 *              scope we request at connection time.
 *   Telegram — NOT SUPPORTED. The Telegram Bot API gives a bot no access to
 *              chat history, so there is genuinely nothing to read. We say so
 *              rather than pretending.
 *
 * A pinned message becomes a Q&A pair when it has at least one reply: the
 * pinned text is the question, the first reply is the answer. That matches the
 * "pin a question, answer it in the thread" pattern people already use. Pins
 * with no replies are counted and reported as skipped rather than silently
 * dropped, so the user can see why the number is lower than expected.
 */

const DISCORD_API = 'https://discord.com/api/v10';
const SLACK_API = 'https://slack.com/api';

const REQUEST_TIMEOUT_MS = 12000;

// A Q&A pair shorter than this is almost certainly noise ("thanks!", "lol").
const MIN_QUESTION_CHARS = 8;
const MIN_ANSWER_CHARS = 4;
// Guard against importing a wall of text as a single "answer".
const MAX_ANSWER_CHARS = 4000;

const clean = (text) =>
    typeof text === 'string'
        ? // Strip the custom-emoji / user-mention syntax that clutters pasted text.
          text.replace(/<a?:[a-zA-Z0-9_]+:\d+>/g, '').replace(/<@!?\d+>/g, '').trim()
        : '';

/** Normalise a candidate pair, or return null if it isn't usable. */
function toPair(question, answer) {
    const q = clean(question);
    const a = clean(answer);

    if (q.length < MIN_QUESTION_CHARS) return null;
    if (a.length < MIN_ANSWER_CHARS) return null;

    return {
        question: q,
        answer: a.length > MAX_ANSWER_CHARS ? `${a.slice(0, MAX_ANSWER_CHARS)}…` : a,
    };
}

// ---------------------------------------------------------------------------
// Discord
// ---------------------------------------------------------------------------

async function discordRequest(path, token) {
    const res = await axios.get(`${DISCORD_API}${path}`, {
        headers: { Authorization: `Bot ${token}` },
        timeout: REQUEST_TIMEOUT_MS,
    });
    return res.data;
}

/**
 * List the guild's text channels that the bot can see.
 * @returns {Promise<Array<{ id, name, topic }>>}
 */
async function listDiscordChannels(credentials) {
    const { token, guildId } = credentials;
    if (!token || !guildId) {
        throw new Error('This Discord connection is missing its server id. Reconnect it to continue.');
    }

    const channels = await discordRequest(`/guilds/${guildId}/channels`, token);

    // Only text channels can hold pins, and only ones the bot can actually read.
    return channels
        .filter((c) => c.type === 0 /* GUILD_TEXT */ && c.permission_overwrites)
        .map((c) => ({ id: c.id, name: c.name, topic: c.topic || '' }));
}

/**
 * Pull Q&A pairs from the pinned messages of the given channels.
 */
async function extractDiscordPairs(credentials, sourceIds) {
    const { token } = credentials;
    const pairs = [];
    let skipped = 0;

    for (const channelId of sourceIds) {
        let pins;
        try {
            pins = await discordRequest(`/channels/${channelId}/pins`, token);
        } catch (err) {
            // One unreadable channel shouldn't abort the whole import.
            logger.warn(`[faqImport] Could not read pins for Discord channel ${channelId}: ${err.message}`);
            continue;
        }

        for (const pin of pins || []) {
            const reference = pin.message_reference?.message_id;
            if (!reference) {
                skipped++;
                continue;
            }

            let questionMessage;
            try {
                questionMessage = await discordRequest(
                    `/channels/${channelId}/messages/${reference}`,
                    token
                );
            } catch {
                skipped++;
                continue;
            }

            const pair = toPair(questionMessage?.content, pin.content);
            if (pair) pairs.push({ ...pair, source: `discord:${channelId}` });
            else skipped++;
        }
    }

    return { pairs, skipped };
}

// ---------------------------------------------------------------------------
// Slack
// ---------------------------------------------------------------------------

async function slackRequest(method, token, body = {}) {
    const res = await axios.post(`${SLACK_API}/${method}`, body, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: REQUEST_TIMEOUT_MS,
    });
    if (!res.data.ok) {
        const detail = res.data.error || 'unknown_error';
        // Slack reports missing scopes with readable names; surface them so the
        // user knows to reconnect rather than just seeing "import failed".
        const hint =
            detail === 'missing_scope'
                ? ` (missing scope: ${res.data.needed_scope || res.data.provided?.missing_scope || 'unknown'})`
                : '';
        throw new Error(`Slack error: ${detail}${hint}`);
    }
    return res.data;
}

async function listSlackChannels(credentials) {
    const { token } = credentials;
    const data = await slackRequest('conversations.list', token, {
        types: 'public_channel',
        limit: 200,
        exclude_archived: true,
    });

    return (data.channels || []).map((c) => ({
        id: c.id,
        name: c.name,
        topic: c.purpose?.value || c.topic?.value || '',
    }));
}

async function extractSlackPairs(credentials, sourceIds) {
    const { token } = credentials;
    const pairs = [];
    let skipped = 0;

    for (const channelId of sourceIds) {
        let pins;
        try {
            pins = await slackRequest('pins.list', token, { channel: channelId });
        } catch (err) {
            logger.warn(`[faqImport] Could not read pins for Slack channel ${channelId}: ${err.message}`);
            continue;
        }

        for (const item of pins?.items || []) {
            const message = item.message;
            if (!message) {
                skipped++;
                continue;
            }

            // A pin with a thread of replies: first reply is the answer.
            // A pin with no thread: the pin text is the answer and the
            // surrounding context is unavailable, so skip it.
            if (!message.thread_ts || message.thread_ts === message.ts) {
                skipped++;
                continue;
            }

            let replies;
            try {
                replies = await slackRequest('conversations.replies', token, {
                    channel: channelId,
                    ts: message.thread_ts,
                    limit: 2,
                });
            } catch {
                skipped++;
                continue;
            }

            // replies[0] is the parent we already have; replies[1] is the answer.
            const answer = (replies.messages || [])[1]?.text;
            const pair = toPair(message.text, answer);
            if (pair) pairs.push({ ...pair, source: `slack:${channelId}` });
            else skipped++;
        }
    }

    return { pairs, skipped };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Whether importing is even possible on this platform. */
const supportsImport = (platform) => platform === 'discord' || platform === 'slack';

const NOT_SUPPORTED = {
    telegram: 'Telegram bots cannot read chat history, so there is nothing to import. Add your FAQs manually.',
    web: 'The web widget has no message history to import from.',
};

/**
 * List the places FAQs could be imported from.
 * @returns {Promise<Array<{ id, name, topic }>>}
 */
async function listSources(platform, credentials) {
    if (!supportsImport(platform)) {
        throw Object.assign(new Error(NOT_SUPPORTED[platform] || 'Import is not supported here.'), {
            statusCode: 400,
        });
    }
    if (!credentials?.token) {
        throw Object.assign(new Error('This connection has no usable credentials. Reconnect it first.'), {
            statusCode: 409,
        });
    }

    return platform === 'discord'
        ? listDiscordChannels(credentials)
        : listSlackChannels(credentials);
}

/**
 * Extract candidate Q&A pairs.
 * @returns {Promise<{ pairs: Array<{question, answer, source}>, skipped: number }>}
 */
async function extractPairs(platform, credentials, sourceIds = []) {
    if (!supportsImport(platform)) {
        throw Object.assign(new Error(NOT_SUPPORTED[platform] || 'Import is not supported here.'), {
            statusCode: 400,
        });
    }
    if (!credentials?.token) {
        throw Object.assign(new Error('This connection has no usable credentials. Reconnect it first.'), {
            statusCode: 409,
        });
    }
    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
        throw Object.assign(new Error('Pick at least one channel to import from.'), { statusCode: 400 });
    }

    return platform === 'discord'
        ? extractDiscordPairs(credentials, sourceIds)
        : extractSlackPairs(credentials, sourceIds);
}

module.exports = { listSources, extractPairs, supportsImport, toPair, NOT_SUPPORTED };
