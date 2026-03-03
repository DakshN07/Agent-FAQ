const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false, // temporarily false for backward compatibility
  },
  guildId: {
    type: String,
    required: false, // Made optional to support non-discord platforms
  },
  platforms: {
    type: [String],
    default: [], // Array of active platforms
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    required: false,
  },
});

module.exports = mongoose.models.Faq || mongoose.model('Faq', faqSchema);
