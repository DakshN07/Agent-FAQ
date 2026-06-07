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