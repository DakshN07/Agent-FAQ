const mongoose = require('mongoose');

const ModerationEventSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null if anonymous
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
  type: { type: String, enum: ['Spam', 'Toxic', 'Scam', 'Risk'], required: true },
  text: { type: String, required: true },
  actionTaken: { type: String, enum: ['Flagged', 'Blocked', 'RateLimited'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ModerationEvent || mongoose.model('ModerationEvent', ModerationEventSchema);
