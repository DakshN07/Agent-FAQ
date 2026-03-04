const express = require('express');
const router = express.Router({ mergeParams: true });
const UnknownQuestion = require('../models/UnknownQuestion');
const { authenticate } = require('../middleware/auth');

// Simple suggestions based on unknown questions per event
router.get('/', authenticate, async (req, res) => {
  try {
    const eventId = req.query.eventId;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    const unknowns = await UnknownQuestion.find({ eventId });

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
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

module.exports = router;
