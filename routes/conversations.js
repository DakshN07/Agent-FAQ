const express = require('express');
const router = express.Router({ mergeParams: true });
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get all conversations for an event
router.get('/', async (req, res) => {
    try {
        const eventId = req.params.eventId || req.query.eventId;
        const { status } = req.query;
        if (!eventId) return res.status(400).json({ error: 'eventId required' });
        
        const filter = { eventId };
        if (status) filter.status = status;

        const conversations = await Conversation.find(filter)
            .sort({ lastMessageAt: -1 })
            .populate('userId', 'username email')
            .lean();

        const Message = require('../models/Message');
        const conversationsWithPreview = await Promise.all(conversations.map(async (conversation) => {
            const latestMessage = await Message.findOne({ conversationId: conversation._id })
                .sort({ createdAt: -1 })
                .lean();
            return { ...conversation, text: latestMessage?.text || '' };
        }));

        res.json(conversationsWithPreview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages for a specific conversation
router.get('/:id/messages', async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.id })
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Send a human reply to a conversation and forward it through the active platform adapter
router.post('/:id/messages', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text is required' });

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const message = await Message.create({
            conversationId: conversation._id,
            text: text.trim(),
            senderType: 'Human',
            senderId: req.user.id
        });

        conversation.status = 'Answered';
        conversation.lastMessageAt = Date.now();
        await conversation.save();

        const integrationManager = require('../services/IntegrationManager');
        const adapter = integrationManager.getAdapter(conversation.eventId.toString(), conversation.platform);
        if (adapter) {
            await adapter.sendMessage(conversation.channelId, text.trim());
        }

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
