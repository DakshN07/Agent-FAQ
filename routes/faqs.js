const express = require('express');
const router = express.Router();
const Faq = require('../models/Faq');
const { getEmbedding } = require('../services/embedding');

// GET all FAQs for an event
router.get('/', async (req, res) => {
    try {
        const query = req.query.eventId && req.query.eventId !== 'undefined' ? { eventId: req.query.eventId } : {};
        const faqs = await Faq.find(query).sort({ _id: -1 });
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new FAQ
router.post('/', async (req, res) => {
    try {
        const { question, answer, eventId, platforms = [] } = req.body;
        // Generate embedding
        const embedding = await getEmbedding(question);

        const newFaq = new Faq({
            eventId,
            question,
            answer,
            platforms,
            embedding
        });
        await newFaq.save();
        res.status(201).json(newFaq);
    } catch (error) {
        console.error("Error creating FAQ:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update FAQ
router.put('/:id', async (req, res) => {
    try {
        const { question, answer, platforms } = req.body;

        let updateData = { question, answer, platforms };
        if (question) {
            const embedding = await getEmbedding(question);
            if (embedding) {
                updateData.embedding = embedding;
            }
        }

        const updatedFaq = await Faq.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedFaq) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json(updatedFaq);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE FAQ
router.delete('/:id', async (req, res) => {
    try {
        const deletedFaq = await Faq.findByIdAndDelete(req.params.id);
        if (!deletedFaq) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
