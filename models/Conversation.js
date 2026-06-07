const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null if anonymous web user
  platform: { type: String, enum: ['discord', 'slack', 'telegram', 'web'], required: true },
  channelId: { type: String, required: true }, // Platform specific channel or session ID
  status: { type: String, enum: ['Answered', 'Pending', 'Needs Review', 'Escalated', 'Spam'], default: 'Pending' },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
