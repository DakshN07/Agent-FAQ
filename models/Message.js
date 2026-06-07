const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  text: { type: String, required: true },
  senderType: { type: String, enum: ['User', 'Agent', 'Human'], required: true },
  senderId: { type: String, default: null }, // User ID or Agent Name or Admin ID
  confidence: { type: Number, default: null }, // Confidence score if answered by Agent
  flags: [{ type: String }], // Array of moderation flags (e.g. 'toxic', 'spam')
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
