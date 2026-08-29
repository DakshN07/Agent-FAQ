const mongoose = require('mongoose');

/**
 * Global application settings.
 *
 * Stored as a single document (singleton). The `key` field is used to
 * guarantee uniqueness so we never accidentally create more than one
 * settings document, regardless of how many times updateSettings runs.
 */
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true, index: true },
    similarityThreshold: { type: Number, default: 0.85, min: 0, max: 1 },
    maxSuggestions: { type: Number, default: 3, min: 0 },
    autoRespond: { type: Boolean, default: true },
    notificationEmail: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
