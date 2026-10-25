const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Faq = require('../models/Faq');
const EventMember = require('../models/EventMember');
const { authenticate } = require('../middleware/auth');
const { generateOnboardingFAQs, generateEventDescription } = require('../services/ai');
const { getEmbedding } = require('../services/embedding');
const { syncFaqVector } = require('../services/vectorStore');
const { resolveMistralKey } = require('../services/mistralKey');
const logger = require('../utils/logger');

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

/**
 * Seed an event's starter FAQs with embeddings.
 *
 * Fire-and-forget: the caller has already responded. Runs the LLM generation
 * and the embedding calls concurrently, and never throws — a new event without
 * starter FAQs is recoverable from the dashboard, a failed request is not.
 */
const seedStarterFAQs = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) return;

    const prompts = await generateOnboardingFAQs(event);
    if (!prompts?.length) return;

    const { key: mistralApiKey } = await resolveMistralKey({ userId });

    await Promise.all(
        prompts.map(async (p) => {
            // Still save the FAQ even if embedding generation fails — the text
            // is what the admin sees in the dashboard.
            const embedding = await getEmbedding(p.question, { apiKey: mistralApiKey || undefined }).catch(() => null);
            const faq = await Faq.create({
                eventId,
                question: p.question,
                answer: p.answer,
                platforms: ['discord', 'slack', 'telegram'],
                embedding: embedding || []
            });

            // Non-throwing: syncFaqVector logs failures loudly but never throws,
            // so a Qdrant outage cannot abort the batch.
            await syncFaqVector(faq);
        })
    );
};

// Create event
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, faqThreshold, instagramHandle, websiteUrl, contactNumber, appointmentLink, useAIIntro, details } = req.body;
        const inviteCode = await generateInviteCode();

        let finalDescription = req.body.description || '';

        // AI enrichment is opt-in and best-effort. Without GEMINI_API_KEY (or if
        // the call fails) services/ai.js falls back to the user's own text, so
        // event creation is never blocked by an optional step.
        if (useAIIntro && details) {
            // Include name in details for the AI prompt
            finalDescription = await generateEventDescription({ ...details, name });
        }

        const newEvent = new Event({
            name,
            description: finalDescription,
            managerId: req.user.id,
            faqThreshold,
            instagramHandle,
            websiteUrl,
            contactNumber,
            appointmentLink,
            inviteCode
        });
        await newEvent.save();

        // Seed FAQs with embeddings so the bot can match from the first question.
        // This runs AFTER the response is sent (see seedStarterFAQs below):
        // seeding is a nice-to-have, and making the user wait on a dozen
        // sequential AI calls (which is what caused multi-minute hangs when a
        // key was missing) is not worth it.
        res.status(201).json({ event: newEvent });

        seedStarterFAQs(newEvent._id, req.user.id).catch((err) =>
            logger.error(`[events] Starter FAQ seeding failed for ${newEvent._id}: ${err.message}`)
        );
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
            platformAccess: ['discord', 'slack', 'telegram'] // Default all access for now
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
