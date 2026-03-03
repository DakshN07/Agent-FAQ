const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

// Create event
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, description, faqThreshold } = req.body;
        const newEvent = new Event({
            name,
            description,
            managerId: req.user.id, // req.user set by auth middleware
            faqThreshold
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List events for authenticated manager
router.get('/', authenticate, async (req, res) => {
    try {
        const events = await Event.find({ managerId: req.user.id }).sort('-createdAt');
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single event details
router.get('/:eventId', authenticate, async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, managerId: req.user.id });
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update event
router.put('/:eventId', authenticate, async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.eventId, managerId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete event
router.delete('/:eventId', authenticate, async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.eventId, managerId: req.user.id });
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
