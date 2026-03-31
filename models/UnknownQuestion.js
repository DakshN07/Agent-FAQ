const mongoose = require('mongoose');

const unknownQuestionSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false, // Required for new ones
  },
  guildId: {
    type: String,
    required: false, // Keep optional
    index: true
  },
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  userId: {
    type: String,
  },
  sourcePlatform: {
    type: String, // e.g. discord, slack, whatsapp
  },
  channelId: {
    type: String,
  },
  isHandoffRequested: {
    type: Boolean,
    default: false
  },
  handoffStatus: {
    type: String,
    enum: ['pending', 'resolved', 'ignored'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
});

// Avoid model overwrite issues in dev environment
module.exports = mongoose.models.UnknownQuestion || mongoose.model('UnknownQuestion', unknownQuestionSchema);
