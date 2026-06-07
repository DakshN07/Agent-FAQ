const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get all conversations for an event
router.get('/', async (req, res) => {
    try {
        const { eventId, status } = req.query;
        if (!eventId) return res.status(400).json({ error: 'eventId required' });
        
        const filter = { eventId };
        if (status) filter.status = status;

        const conversations = await Conversation.find(filter)
            .sort({ lastMessageAt: -1 })
            .populate('userId', 'username email');

        res.json(conversations);
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

module.exports = router;
