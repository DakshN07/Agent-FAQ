const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const JWT_SECRET = config.jwt.secret;
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const redisClient = require('../libs/redis');

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

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
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
router.post('/login', validate(authValidation.login), async (req, res) => {
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

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
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

    const sessionToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token: sessionToken, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
