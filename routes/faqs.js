const express = require('express');
const router = express.Router();
const Faq = require('../models/Faq');
const Event = require('../models/Event');
const { getEmbedding } = require('../services/embedding');
const { syncFaqVector, deleteFaq } = require('../services/vectorStore');
const { authenticate, authorizeEvent } = require('../middleware/auth');

// All FAQ routes require authentication.
router.use(authenticate);

/**
 * Loads the FAQ at :id and verifies the caller has access to its event.
 * Attaches req.faq.
 */
const authorizeFaq = async (req, res, next) => {
    try {
        let faq;
        try {
            faq = await Faq.findById(req.params.id);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid FAQ id' });
        }
        if (!faq) return res.status(404).json({ error: 'FAQ not found' });

        // A FAQ must belong to an event to be access-controlled.
        if (!faq.eventId) {
            return res.status(403).json({ error: 'FAQ is not associated with an event' });
        }

        const event = await Event.findById(faq.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const isManager = event.managerId && event.managerId.toString() === req.user.id.toString();
        if (!isManager) {
            const EventMember = require('../models/EventMember');
            const membership = await EventMember.findOne({
                eventId: event._id,
                userId: req.user.id,
                status: 'Active',
            });
            if (!membership) {
                return res.status(403).json({ error: 'You do not have access to this FAQ' });
            }
        }

        req.faq = faq;
        next();
    } catch (error) {
        next(error);
    }
};

// GET all FAQs for an event
router.get('/', authorizeEvent(), async (req, res, next) => {
    try {
        const faqs = await Faq.find({ eventId: req.event._id }).sort({ _id: -1 });
        res.json(faqs);
    } catch (error) {
        next(error);
    }
});

// POST new FAQ
router.post('/', authorizeEvent(), async (req, res, next) => {
    try {
        const { question, answer, platforms = [] } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ error: 'question and answer are required' });
        }

        const embedding = await getEmbedding(question);

        const newFaq = new Faq({
            eventId: req.event._id,
            question,
            answer,
            platforms: Array.isArray(platforms) ? platforms : [],
            embedding: embedding || undefined,
        });
        await newFaq.save();

        // Keep the vector store in sync so the FAQ is immediately searchable.
        // Non-throwing: if no embedding was produced (or Qdrant is down) the
        // keyword/legacy path still works and the failure is logged loudly.
        await syncFaqVector(newFaq);

        res.status(201).json(newFaq);
    } catch (error) {
        next(error);
    }
});

// PUT update FAQ
router.put('/:id', authorizeFaq, async (req, res, next) => {
    try {
        const { question, answer, platforms } = req.body;

        const updateData = {};
        if (question !== undefined) updateData.question = question;
        if (answer !== undefined) updateData.answer = answer;
        if (platforms !== undefined) updateData.platforms = platforms;

        if (question) {
            const embedding = await getEmbedding(question);
            if (embedding) updateData.embedding = embedding;
        }

        const updatedFaq = await Faq.findByIdAndUpdate(req.faq._id, updateData, { new: true });

        // Re-sync the vector point (upsert overwrites by the deterministic UUID).
        // When a new question was supplied but its embedding failed to generate,
        // remove the stale point rather than leaving a mismatched vector behind.
        if (question) {
            if (updateData.embedding) {
                await syncFaqVector(updatedFaq);
            } else {
                await deleteFaq(updatedFaq._id);
            }
        }

        res.json(updatedFaq);
    } catch (error) {
        next(error);
    }
});

// DELETE FAQ
router.delete('/:id', authorizeFaq, async (req, res, next) => {
    try {
        const faqId = req.faq._id;
        await Faq.findByIdAndDelete(faqId);
        // Best-effort removal from the vector store (non-throwing, logged).
        await deleteFaq(faqId);
        res.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
