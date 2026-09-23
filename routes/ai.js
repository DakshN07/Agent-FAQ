const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');
const { normalizeThreshold } = require('../utils/threshold');
const { getSettings } = require('../utils/storage');
const logger = require('../utils/logger');

/**
 * AI console endpoint.
 *
 * Previously this called raw OpenAI with no relation to the channel bots, so
 * the same question could get different answers depending on where it was
 * asked. It now runs the SAME LangGraph workflow as Discord/Slack/Telegram
 * (moderation -> supervisor -> faq/analytics agent with RAG over the event's
 * FAQs), so answers are consistent across every surface.
 */

// GET /ask?question=...&eventId=...
router.get('/ask', authenticate, async (req, res, next) => {
  const question = typeof req.query.question === 'string' ? req.query.question.trim() : '';
  const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : '';

  if (!question) return res.status(400).json({ error: 'Missing question' });
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });

  try {
    const event = await Event.findById(eventId);
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
        return res.status(403).json({ error: 'You do not have access to this event' });
      }
    }

    const settings = await getSettings().catch(() => null);
    const faqThreshold = normalizeThreshold(event.faqThreshold ?? settings?.similarityThreshold);

    const { createSupportWorkflow } = require('../services/langgraph/workflow');
    const workflow = createSupportWorkflow();

    const initialState = {
      messages: [{ role: 'user', content: question }],
      eventId,
      platform: 'web',
      userId: req.user.id,
      nextAgent: null,
      isFlagged: false,
      confidenceScore: 0.0,
      finalAnswer: null,
      faqThreshold,
    };

    const finalState = await workflow.invoke(initialState);

    if (finalState.isFlagged) {
      return res.status(200).json({
        answer: finalState.finalAnswer || 'I cannot process this request.',
        confidence: 0,
        matched: false,
      });
    }

    const confidence = finalState.confidenceScore || 0;
    res.status(200).json({
      answer: finalState.finalAnswer,
      confidence,
      matched: confidence >= faqThreshold,
    });
  } catch (error) {
    logger.error(`[ai] Workflow failed: ${error.message}`);
    next(error);
  }
});

module.exports = router;