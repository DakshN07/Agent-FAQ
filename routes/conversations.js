const express = require('express');
const router = express.Router({ mergeParams: true });
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const { authenticate, authorizeEvent } = require('../middleware/auth');

router.use(authenticate);

// Get all conversations for an event
router.get('/', authorizeEvent(), async (req, res, next) => {
    try {
        const { status } = req.query;

        const filter = { eventId: req.event._id };
        if (status) filter.status = status;

        const conversations = await Conversation.find(filter)
            .sort({ lastMessageAt: -1 })
            .populate('userId', 'username email');

        res.json(conversations);
    } catch (err) {
        next(err);
    }
});

// Get messages for a specific conversation (scoped to the caller's events)
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

        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
