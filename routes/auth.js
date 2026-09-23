const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const JWT_SECRET = config.jwt.secret;
const { authenticate } = require('../middleware/auth');
const { createAuthLimiter } = require('../middleware/authLimiter');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const redisClient = require('../libs/redis');
const tokenService = require('../services/tokenService');

// Brute-force protection specifically for credential endpoints.
const loginLimiter = createAuthLimiter({ max: 10 });
const passwordLimiter = createAuthLimiter({ max: 5, message: 'Too many password attempts. Please try again in 15 minutes.' });

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    // Example of explicit Redis cache logic
    if (redisClient) {
      const cachedUser = await redisClient.get(`user:${req.user.id}`);
      if (cachedUser) {
        return res.json(JSON.parse(cachedUser));
      }
    }

    const user = await User.findById(req.user.id).select('-password');
    
    if (redisClient && user) {
      // Cache for 1 hour
      await redisClient.setEx(`user:${req.user.id}`, 3600, JSON.stringify(user));
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me
router.put('/me', authenticate, validate(authValidation.updateMe), async (req, res) => {
  try {
    const { phoneNumber, linkedinProfile } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { phoneNumber, linkedinProfile }, { new: true }).select('-password');
    
    // Invalidate cache
    if (redisClient) {
      await redisClient.del(`user:${req.user.id}`);
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
// POST /api/auth/register
router.post('/register', validate(authValidation.register), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const { accessToken, refreshToken } = await tokenService.issueSession(user);
    tokenService.setRefreshCookie(res, refreshToken);

    res.status(201).json({ token: accessToken, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
// POST /api/auth/login
router.post('/login', loginLimiter, validate(authValidation.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = await tokenService.issueSession(user);
    tokenService.setRefreshCookie(res, refreshToken);

    res.json({ token: accessToken, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/accept-invite
router.post('/accept-invite', validate(authValidation.acceptInvite), async (req, res) => {
  try {
    const { token, name, password } = req.body;

    // Verify and decode the invite token (signed by config.jwt.secret)
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    const { email, eventId } = payload;
    if (!email || !eventId) {
      return res.status(400).json({ error: 'Invitation token is malformed' });
    }

    // Look up the pending invite
    const EventMember = require('../models/EventMember');
    const member = await EventMember.findOne({ eventId, email, status: 'Pending' });
    if (!member) {
      return res.status(400).json({ error: 'No pending invitation found for this email' });
    }

    // Reject if email is already registered (must not silently overwrite an account)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account already exists for this email. Please sign in instead.' });
    }

    const user = new User({ username: name || email.split('@')[0], email, password });
    await user.save();

    member.userId = user._id;
    member.status = 'Active';
    await member.save();

    const { accessToken, refreshToken } = await tokenService.issueSession(user);
    tokenService.setRefreshCookie(res, refreshToken);

    res.status(201).json({ token: accessToken, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/refresh — rotate the refresh token into a fresh access token
router.post('/refresh', validate(authValidation.refresh), async (req, res) => {
  try {
    const refreshToken = tokenService.refreshTokenFromRequest(req);
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const result = await tokenService.refreshAccessToken(refreshToken);
    if (!result.ok) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Rotated refresh token goes back into the httpOnly cookie.
    tokenService.setRefreshCookie(res, result.refreshToken);
    res.json({ token: result.accessToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout — revoke the refresh session and clear the cookie
router.post('/logout', async (req, res) => {
  const refreshToken = tokenService.refreshTokenFromRequest(req);
  if (refreshToken) {
    await tokenService.revokeSession(refreshToken).catch(() => {});
  }
  tokenService.clearRefreshCookie(res);
  res.json({ message: 'Logged out' });
});

// PUT /api/auth/password — change password; revokes all refresh sessions
router.put('/password', authenticate, passwordLimiter, validate(authValidation.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password' });
    }

    user.password = newPassword; // pre-save hook re-hashes
    await user.save();

    // Invalidate all other devices/sessions; this session's 15-min access
    // token remains valid until it naturally expires.
    await tokenService.revokeAllUserSessions(user._id);
    tokenService.clearRefreshCookie(res);

    res.json({ message: 'Password updated. Please sign in again.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
