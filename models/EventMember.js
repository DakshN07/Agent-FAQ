const mongoose = require('mongoose');

const EventMemberSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional until accepted
    email: { type: String, required: true }, // Store email for invites
    role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
    status: { type: String, enum: ['Pending', 'Active', 'Removed'], default: 'Pending' },
    platformAccess: [{ type: String, enum: ['discord', 'slack', 'whatsapp', 'telegram', 'web'] }],
    addedAt: { type: Date, default: Date.now },
});

// Ensure an email can only be invited/added to an event once
EventMemberSchema.index({ eventId: 1, email: 1 }, { unique: true });

module.exports = mongoose.models.EventMember || mongoose.model('EventMember', EventMemberSchema);
