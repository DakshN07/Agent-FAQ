const express = require('express');
const router = express.Router();
const UnknownQuestion = require('../models/UnknownQuestion');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const { authenticate, authorizeEvent } = require('../middleware/auth');

router.use(authenticate);

// GET / — list unknown questions for an event the caller can access
router.get('/', authorizeEvent(), async (req, res, next) => {
  try {
    const unknownQuestions = await UnknownQuestion.find({ eventId: req.event._id }).sort({ count: -1 });
    res.json(unknownQuestions);
  } catch (error) {
    next(error);
  }
});

// POST /:id/answer
// Event manager provides an answer.
// 1. Broadcasts to the channel where it was asked (if Integration is active).
// 2. Creates a new FAQ so future questions are auto-answered.
// 3. Deletes the UnknownQuestion.
router.post('/:id/answer', async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      return res.status(400).json({ error: 'answer is required' });
    }

    let unknown;
    try {
      unknown = await UnknownQuestion.findById(req.params.id);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid question id' });
    }
    if (!unknown) return res.status(404).json({ error: 'Question not found' });

    // Authorization: the caller must own or belong to the question's event.
    if (!unknown.eventId) {
      return res.status(403).json({ error: 'Question is not associated with an event' });
    }
    const event = await Event.findById(unknown.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isManager = event.managerId && event.managerId.toString() === req.user.id.toString();
    if (!isManager) {
      const membership = await EventMember.findOne({
        eventId: event._id,
        userId: req.user.id,
        status: 'Active',
      });
      if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this event' });
      }
    }

    // 1. Send via integration manager
    const integrationManager = require('../services/IntegrationManager');
    const adapter = integrationManager.getAdapter(unknown.eventId, unknown.sourcePlatform);
    if (adapter && unknown.channelId) {
      try {
        await adapter.sendMessage(unknown.channelId, `*Answer from Organizer:*\n${answer}`);
      } catch (e) {
        console.warn('Failed to broadcast back to platform', e.message);
      }
    }

    // 2. Create FAQ using Learning Agent
    const { runLearningAgent } = require('../services/langgraph/agents/learning');
    await runLearningAgent(
      unknown.eventId,
      unknown.text,
      answer,
      unknown.sourcePlatform,
      req.user ? req.user.id : null
    );

    // 3. Delete UnknownQuestion
    await UnknownQuestion.findByIdAndDelete(unknown._id);

    res.json({ message: 'Answered and added to FAQ database.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
