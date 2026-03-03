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

module.exports = router;
