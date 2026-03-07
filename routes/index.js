const express = require('express');
const router = express.Router();

const faqsRouter = require('./faqs');
const settingsRouter = require('./settings');
const analyticsRouter = require('./analytics');
const suggestionsRouter = require('./suggestions');
const unknownQuestionsRouter = require('./unknownQuestions');
const eventsRouter = require('./events');
const integrationsRouter = require('./integrations');
const teamRouter = require('./team');
const webhooksRouter = require('./webhooks');
const oauthRouter = require('./oauth');

router.use('/faqs', faqsRouter);
router.use('/settings', settingsRouter);
router.use('/analytics', analyticsRouter);
router.use('/suggestions', suggestionsRouter);
router.use('/unknown-questions', unknownQuestionsRouter);
router.use('/events', eventsRouter);
eventsRouter.use('/:eventId/integrations', integrationsRouter);
eventsRouter.use('/:eventId/team', teamRouter);

router.use('/webhooks', webhooksRouter);
router.use('/oauth', oauthRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FAQ Bot API is running' });
});

module.exports = router;
