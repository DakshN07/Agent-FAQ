const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'moderator', 'owner'], default: 'user' },
  status: { type: String, enum: ['active', 'flagged', 'banned'], default: 'active' },
  platforms: {
    discordId: { type: String, default: null },
    slackId: { type: String, default: null },
    telegramId: { type: String, default: null },
    webId: { type: String, default: null } // anonymous session ID
  },
  spamScore: { type: Number, default: 0 },

  // Bring-your-own Mistral API key, encrypted at rest (AES-256-GCM via
  // utils/crypto). We only ever store the ciphertext bundle — never plaintext.
  // `select: false` keeps it out of every incidental query result so a stray
  // `.find()` can never leak it into an API response.
  mistralApiKey: {
    type: {
      ciphertext: { type: String },
      iv: { type: String },
      tag: { type: String },
    },
    default: null,
    select: false,
  },
  // Set when the key last passed a live verification against Mistral.
  mistralKeyVerifiedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema); 