const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Faq = require('../models/Faq');
const EventMember = require('../models/EventMember');
const { authenticate } = require('../middleware/auth');
const { generateOnboardingFAQs } = require('../services/ai');

// Generate unique invite code helper
const generateInviteCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await Event.findOne({ inviteCode: code });
        if (!existing) isUnique = true;
    }
    return code;
};

// Create event
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, description, generateFAQs, faqThreshold } = req.body;
        const inviteCode = await generateInviteCode();
        const newEvent = new Event({
            name,
            description,
            managerId: req.user.id,
            faqThreshold,
            inviteCode
        });
        await newEvent.save();

        let generatedPrompts = [];
        if (generateFAQs !== false) {
            generatedPrompts = await generateOnboardingFAQs(name, description);

            // Auto save generated prompts
            if (generatedPrompts && generatedPrompts.length > 0) {
                const faqDocs = generatedPrompts.map(p => ({
                    eventId: newEvent._id,
                    question: p.question,
                    answer: p.answer,
                    platforms: ['discord', 'slack', 'whatsapp']
                }));
                await Faq.insertMany(faqDocs);
            }
        }

        res.status(201).json({ event: newEvent, aiPrompts: generatedPrompts });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// List events for authenticated manager or member
router.get('/', authenticate, async (req, res) => {
    try {
        const memberships = await EventMember.find({ userId: req.user.id }).select('eventId');
        const memberEventIds = memberships.map(m => m.eventId);

        const events = await Event.find({
            $or: [
                { managerId: req.user.id },
                { _id: { $in: memberEventIds } }
            ]
        }).sort('-createdAt');
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join event via invite code
router.post('/join', authenticate, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });

        const event = await Event.findOne({ inviteCode: inviteCode.toUpperCase() });
        if (!event) return res.status(404).json({ error: 'Invalid invite code or event not found' });

        if (event.managerId.toString() === req.user.id) {
            return res.status(400).json({ error: 'You are the owner of this event' });
        }

        const existingMember = await EventMember.findOne({ eventId: event._id, userId: req.user.id });
        if (existingMember) return res.status(400).json({ error: 'You are already a member of this event' });

        const newMember = new EventMember({
            eventId: event._id,
            userId: req.user.id,
            role: 'agent',
            platformAccess: ['discord', 'slack', 'whatsapp', 'telegram'] // Default all access for now
        });
        await newMember.save();

        res.json({ message: 'Successfully joined team', event });
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
