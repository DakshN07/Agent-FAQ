const express = require('express');
const router = express.Router();
const ModerationEvent = require('../models/ModerationEvent');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get all moderation events for an event
router.get('/', async (req, res) => {
    try {
        const { eventId } = req.query;
        if (!eventId) return res.status(400).json({ error: 'eventId required' });
        
        const events = await ModerationEvent.find({ eventId })
            .sort({ createdAt: -1 })
            .populate('userId', 'username email');

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
