const mongoose = require('mongoose');

const EventMemberSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
    platformAccess: [{ type: String, enum: ['discord', 'slack', 'whatsapp', 'telegram', 'web'] }], // empty means all or none depending on logic, let's assume specific access.
    addedAt: { type: Date, default: Date.now },
});

// Ensure a user can only be added to an event once
EventMemberSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.EventMember || mongoose.model('EventMember', EventMemberSchema);
