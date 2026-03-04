const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  faqThreshold: { type: Number, default: 0.8 }, // Threshold to auto-answer
  inviteCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
