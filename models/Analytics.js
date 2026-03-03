const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: false },
  platform: { type: String, required: false }, // record analytics per platform
  matched: { type: Number, default: 0 },
  unmatched: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);