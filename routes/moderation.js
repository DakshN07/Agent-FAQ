const express = require('express');
const router = express.Router({ mergeParams: true });
const ModerationEvent = require('../models/ModerationEvent');
const { authenticate, authorizeEvent } = require('../middleware/auth');

router.use(authenticate);

// Get all moderation events for an event
router.get('/', authorizeEvent(), async (req, res, next) => {
    try {
        const events = await ModerationEvent.find({ eventId: req.event._id })
            .sort({ createdAt: -1 })
            .populate('userId', 'username email');

        res.json(events);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
