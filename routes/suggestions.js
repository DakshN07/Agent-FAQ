const express = require('express');
const router = express.Router({ mergeParams: true });
const UnknownQuestion = require('../models/UnknownQuestion');
const { authenticate, authorizeEvent } = require('../middleware/auth');

// Simple suggestions based on unknown questions per event
router.get('/', authenticate, authorizeEvent(), async (req, res, next) => {
  try {
    const unknowns = await UnknownQuestion.find({ eventId: req.event._id });

    // Simple logic: if asked > 1 times, suggest it
    const suggestions = unknowns
      .filter(u => u.count > 1)
      .map(u => ({
        id: u._id,
        question: u.text,
        suggestedAnswer: "Suggested based on frequent requests.",
        confidence: Math.min(u.count * 0.2, 1.0),
        timesAsked: u.count,
        category: 'General',
        priority: u.count > 3 ? 'high' : 'medium'
      }))
      .sort((a, b) => b.timesAsked - a.timesAsked)
      .slice(0, 10);

    res.json({
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    next(error);
  }
});

module.exports = router;
