const express = require('express');
const router = express.Router();
const UnknownQuestion = require('../models/UnknownQuestion');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /
router.get('/', async (req, res) => {
  try {
    const query = req.query.eventId && req.query.eventId !== 'undefined' ? { eventId: req.query.eventId } : {};
    const unknownQuestions = await UnknownQuestion.find(query).sort({ count: -1 });
    res.json(unknownQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/answer
// Event manager provides an answer. 
// 1. Broadcasts to the channel where it was asked (if Integration is active).
// 2. Creates a new FAQ so future questions are auto-answered.
// 3. Deletes the UnknownQuestion.
router.post('/:id/answer', async (req, res) => {
  try {
    const { answer } = req.body;
    const unknown = await UnknownQuestion.findById(req.params.id);
    if (!unknown) return res.status(404).json({ error: 'Question not found' });

    // Ensure they have permission (eventId matches their managed events)
    // Simplified for now assuming middleware does enough or they only see their own.

    // 1. Send via integration manager
    const integrationManager = require('../services/IntegrationManager');
    const adapter = integrationManager.getAdapter(unknown.eventId, unknown.sourcePlatform);
    if (adapter && unknown.channelId) {
      await adapter.sendMessage(unknown.channelId, `*Answer from Organizer:*\n${answer}`);
    }

    // 2. Create FAQ
    const Faq = require('../models/Faq');
    const { getEmbedding } = require('../services/embedding');
    const embedding = await getEmbedding(unknown.text);

    const newFaq = new Faq({
      eventId: unknown.eventId,
      question: unknown.text,
      answer: answer,
      embedding: embedding,
      platforms: [unknown.sourcePlatform]
    });
    await newFaq.save();

    // 3. Delete UnknownQuestion
    await UnknownQuestion.findByIdAndDelete(unknown._id);

    res.json({ message: 'Answered and added to FAQ database.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
