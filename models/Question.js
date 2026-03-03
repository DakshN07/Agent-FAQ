const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: false },
  question: { type: String, required: true }, // Removed unique: true to allow same question across events
  count: { type: Number, default: 1 },
  answer: { type: String, default: null },
  answeredBy: { type: String, default: null },
  answeredAt: { type: Date, default: null }
});

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);
