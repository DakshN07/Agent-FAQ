const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    platform: {
        type: String,
        required: true,
        enum: ['discord', 'slack', 'telegram', 'web'],
    },

    // Encrypted credential bundle (AES-256-GCM). `select: false` keeps it out of
    // every incidental query so a plain find() can never serialize a bot token
    // into an API response.
    encryptedCredentials: {
        type: {
            ciphertext: { type: String },
            iv: { type: String },
            tag: { type: String },
        },
        default: null,
        select: false,
    },

    // Non-secret display metadata (guild name, workspace name, bot username).
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    channelMappings: { type: mongoose.Schema.Types.Mixed, default: {} },

    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
    // Last connection/runtime failure, surfaced in the dashboard so a silently
    // dead integration is visible instead of just "not answering".
    lastError: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
});

// One connection per platform per event.
IntegrationSchema.index({ eventId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);