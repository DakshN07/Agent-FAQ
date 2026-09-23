const express = require('express');
const router = express.Router({ mergeParams: true });
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const { authenticate, authorizeEvent } = require('../middleware/auth');
const integrationManager = require('../services/IntegrationManager');
const logger = require('../utils/logger');

router.use(authenticate);

/** Parse ?page & ?limit with sane defaults and a 100-record cap. */
function paginationParams(req, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function sendPage(res, data, total, page, limit) {
  res.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

// Get all conversations for an event (paginated)
router.get('/', authorizeEvent(), async (req, res, next) => {
    try {
        const { status } = req.query;
        const { page, limit, skip } = paginationParams(req);

        const filter = { eventId: req.event._id };
        if (status) filter.status = status;

        const [total, conversations] = await Promise.all([
            Conversation.countDocuments(filter),
            Conversation.find(filter)
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username email'),
        ]);

        sendPage(res, conversations, total, page, limit);
    } catch (err) {
        next(err);
    }
});

// Server-Sent Events stream: real-time conversation/message updates.
// EventSource cannot send an Authorization header, so the short-lived access
// token is passed via ?token= (15m TTL). Events are scoped to this event.
router.get('/stream', authorizeEvent(), async (req, res, next) => {
    try {
        const eventId = req.event._id.toString();

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering
        res.flushHeaders();

        res.write(`event: connected\ndata: ${JSON.stringify({ eventId })}\n\n`);

        const emitIfScoped = (name) => (payload) => {
            if (payload && String(payload.eventId) === eventId) {
                res.write(`event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`);
            }
        };
        const onMessage = emitIfScoped('message');
        const onConversation = emitIfScoped('conversation');

        integrationManager.on('message:new', onMessage);
        integrationManager.on('conversation:upserted', onConversation);

        // Heartbeat keeps proxies (and the client) from killing the stream.
        const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

        req.on('close', () => {
            clearInterval(heartbeat);
            integrationManager.removeListener('message:new', onMessage);
            integrationManager.removeListener('conversation:upserted', onConversation);
            res.end();
        });
    } catch (err) {
        next(err);
    }
});

// Get messages for a specific conversation (paginated, scoped to caller's events)
router.get('/:id/messages', async (req, res, next) => {
    try {
        let conversation;
        try {
            conversation = await Conversation.findById(req.params.id);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid conversation id' });
        }
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        if (!conversation.eventId) {
            return res.status(403).json({ error: 'Conversation is not associated with an event' });
        }

        const event = await Event.findById(conversation.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const isManager = event.managerId && event.managerId.toString() === req.user.id.toString();
        if (!isManager) {
            const membership = await EventMember.findOne({
                eventId: event._id,
                userId: req.user.id,
                status: 'Active',
            });
            if (!membership) {
                return res.status(403).json({ error: 'You do not have access to this conversation' });
            }
        }

        const { page, limit, skip } = paginationParams(req, { defaultLimit: 50 });
        const [total, messages] = await Promise.all([
            Message.countDocuments({ conversationId: conversation._id }),
            Message.find({ conversationId: conversation._id })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit),
        ]);

        sendPage(res, messages, total, page, limit);
    } catch (err) {
        next(err);
    }
});

// Send a human (manual) reply to a conversation through the connected channel bot
router.post('/:id/reply', authorizeEvent(), async (req, res, next) => {
    try {
        const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
        if (!text) {
            return res.status(400).json({ error: 'Reply text is required' });
        }
        if (text.length > 2000) {
            return res.status(400).json({ error: 'Reply must be 2000 characters or fewer' });
        }

        let conversation;
        try {
            conversation = await Conversation.findById(req.params.id);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid conversation id' });
        }
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        if (String(conversation.eventId) !== String(req.event._id)) {
            return res.status(403).json({ error: 'Conversation does not belong to this event' });
        }

        // Manual replies require a live channel bot for the conversation's platform.
        const adapter = integrationManager.getAdapter(req.event._id.toString(), conversation.platform);
        if (!adapter) {
            const hint =
                conversation.platform === 'web'
                    ? 'Web chat manual replies are not supported yet — connect Discord, Slack, or Telegram to reply live.'
                    : 'No active bot connection for this platform. Reconnect the channel integration to enable manual replies.';
            return res.status(409).json({ error: hint });
        }

        await adapter.sendMessage(conversation.channelId, text);

        const message = await Message.create({
            conversationId: conversation._id,
            text,
            senderType: 'Human',
            senderId: req.user.id,
        });

        conversation.lastMessageAt = Date.now();
        conversation.status = 'Pending'; // awaiting the user's next message
        await conversation.save();

        integrationManager.emit('message:new', {
            eventId: String(conversation.eventId),
            platform: conversation.platform,
            conversationId: conversation._id,
            message: { text, senderType: 'Human' },
        });
        integrationManager.emit('conversation:upserted', {
            eventId: String(conversation.eventId),
            platform: conversation.platform,
            conversation,
        });

        logger.info(`[conversations] Manual reply sent to ${conversation._id} by ${req.user.id}`);
        res.status(201).json(message);
    } catch (err) {
        // adapter.sendMessage failures are logged inside the adapters (they
        // historically swallow errors); surface clearly here.
        logger.error(`[conversations] Manual reply failed for ${req.params.id}: ${err.message}`);
        next(err);
    }
});

module.exports = router;