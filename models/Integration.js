const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    platform: { type: String, required: true, enum: ['discord', 'slack', 'telegram', 'web'] },
    credentials: { type: mongoose.Schema.Types.Mixed }, // e.g., botToken, webhookUrl, secrets
    channelMappings: { type: mongoose.Schema.Types.Mixed }, // e.g., mapping channels to specific contexts (if any)
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
