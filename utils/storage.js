const Settings = require('../models/Settings');

/**
 * Storage helper for global application settings.
 *
 * Backed by the MongoDB `Settings` collection as a singleton document
 * (identified by key='global'). Replaces the previous file-based /
 * in-memory storage that was referenced but never implemented.
 */

const DEFAULTS = {
  similarityThreshold: 0.85,
  maxSuggestions: 3,
  autoRespond: true,
  notificationEmail: null,
};

// Only these fields may be updated via the API (prevents mass assignment).
const UPDATABLE_FIELDS = ['similarityThreshold', 'maxSuggestions', 'autoRespond', 'notificationEmail'];

/**
 * Fetch the global settings document, creating it with defaults if absent.
 * @returns {Promise<object>} plain settings object
 */
async function getSettings() {
  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', ...DEFAULTS } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return settings;
}

/**
 * Update the global settings document with a whitelisted subset of fields.
 * @param {object} updates
 * @returns {Promise<object>} the updated settings object
 */
async function updateSettings(updates = {}) {
  const sanitized = {};
  for (const field of UPDATABLE_FIELDS) {
    if (updates[field] !== undefined) sanitized[field] = updates[field];
  }

  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    { $set: sanitized, $setOnInsert: { key: 'global' } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean();
  return settings;
}

module.exports = { getSettings, updateSettings };
