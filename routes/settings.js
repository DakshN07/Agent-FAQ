const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { authenticate } = require('../middleware/auth');

// Global application settings are admin-only.
router.use(authenticate);

const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: admin role required' });
  }
  next();
};

// GET / — read global settings
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const settings = await storage.getSettings();
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
});

// PUT / — update global settings (whitelisted fields only, see utils/storage)
router.put('/', requireAdmin, async (req, res, next) => {
  try {
    const { similarityThreshold, maxSuggestions, autoRespond, notificationEmail } = req.body;

    if (
      similarityThreshold !== undefined &&
      (typeof similarityThreshold !== 'number' || similarityThreshold < 0 || similarityThreshold > 1)
    ) {
      return res.status(400).json({ error: 'similarityThreshold must be a number between 0 and 1' });
    }
    if (maxSuggestions !== undefined && (!Number.isInteger(maxSuggestions) || maxSuggestions < 0)) {
      return res.status(400).json({ error: 'maxSuggestions must be a non-negative integer' });
    }
    if (autoRespond !== undefined && typeof autoRespond !== 'boolean') {
      return res.status(400).json({ error: 'autoRespond must be a boolean' });
    }

    const settings = await storage.updateSettings({
      similarityThreshold,
      maxSuggestions,
      autoRespond,
      notificationEmail,
    });
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
