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
    let event;
    try {
      event = await Event.findById(eventId);
    } catch {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
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

    // Resolve the Mistral key up-front. If there is none, fail fast with an
    // actionable message instead of letting the graph make several doomed
    // provider calls and surface a confusing 500.
    const { resolveMistralKey } = require('../services/mistralKey');
    const { key: mistralApiKey, source: keySource } = await resolveMistralKey({ userId: req.user.id });
    if (!mistralApiKey) {
      return res.status(503).json({
        error:
          'No Mistral API key is configured. Add yours in Settings, or set MISTRAL_API_KEY on the server.',
        code: 'MISTRAL_KEY_MISSING',
      });
    }

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
      mistralApiKey,
    };

    const finalState = await workflow.invoke(initialState);

    logger.info(`[ai] answered (key source: ${keySource}, matched: ${finalState.confidenceScore >= faqThreshold})`);

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
    // Provider-level failures (bad key, quota, rate limit, timeout) are the
    // common case here. Translate the common ones into actionable messages so
    // the user is not staring at an opaque 500.
    const status = error?.status ?? error?.response?.status;

    if (status === 401 || status === 403) {
      logger.error('[ai] Mistral rejected the API key');
      return res.status(502).json({
        error: 'Mistral rejected the configured API key. Please re-enter a valid key in Settings.',
        code: 'MISTRAL_KEY_INVALID',
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error: 'Mistral rate limit reached or the account is out of credit. Try again shortly.',
        code: 'MISTRAL_RATE_LIMITED',
      });
    }

    logger.error(`[ai] Workflow failed: ${error.message}`, { stack: error.stack });
    next(error);
  }
});

module.exports = router;