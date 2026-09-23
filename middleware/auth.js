const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');

const JWT_SECRET = config.jwt.secret;

const authenticate = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // Server-Sent Events can't set an Authorization header, so accept the
  // access token via ?token= (short TTL, e.g. 15m — SSE only).
  if (!token && req.query && typeof req.query.token === 'string' && req.query.token.length) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
};

/**
 * Resolve the event id from (in order) the route param, query string, or body.
 */
const resolveEventId = (req) =>
  req.params.eventId || req.query.eventId || (req.body && req.body.eventId);

/**
 * Authorization middleware: ensures the authenticated user may access the
 * event identified by eventId (param/query/body). A user has access if they
 * are the event's manager OR an active EventMember.
 *
 * On success attaches `req.event` and `req.eventRole` ('manager' | member role).
 * Must run AFTER `authenticate`.
 *
 * @param {{ managerOnly?: boolean }} [opts]
 */
const authorizeEvent = (opts = {}) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const eventId = resolveEventId(req);
    if (!eventId || eventId === 'undefined') {
      return res.status(400).json({ error: 'eventId is required' });
    }

    let event;
    try {
      event = await Event.findById(eventId);
    } catch (e) {
      // Invalid ObjectId etc. — treat as not found rather than 500.
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const userId = req.user.id;
    const isManager = event.managerId && event.managerId.toString() === userId.toString();

    if (isManager) {
      req.event = event;
      req.eventRole = 'manager';
      return next();
    }

    if (opts.managerOnly) {
      return res.status(403).json({ error: 'Only the event manager can perform this action' });
    }

    const membership = await EventMember.findOne({
      eventId: event._id,
      userId,
      status: 'Active',
    });

    if (!membership) {
      return res.status(403).json({ error: 'You do not have access to this event' });
    }

    req.event = event;
    req.eventRole = membership.role;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { authenticate, requireRole, authorizeEvent, resolveEventId };
