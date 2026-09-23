const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Optional per-event override for the auto-answer threshold. When unset,
  // the effective threshold falls back to the global Settings
  // (similarityThreshold, default 0.85). No schema default is used so a
  // stored 0.8 can never shadow the user-facing global knob silently.
  faqThreshold: { type: Number, min: 0, max: 1 },
  inviteCode: { type: String, unique: true },
  instagramHandle: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  appointmentLink: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
