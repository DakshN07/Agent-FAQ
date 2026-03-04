const express = require('express');
const router = express.Router({ mergeParams: true });
const EventMember = require('../models/EventMember');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is admin of the event
const checkEventAdmin = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Simplification: In a full app, check if req.user is manager OR has EventMember role='admin'
        if (event.managerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Only event managers can manage the team' });
        }

        req.event = event;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.use(authenticate, checkEventAdmin);

// GET all team members for an event
router.get('/', async (req, res) => {
    try {
        const members = await EventMember.find({ eventId: req.params.eventId }).populate('userId', 'username email');
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST invite/add team member (Simplified: directly adding if email exists)
router.post('/', async (req, res) => {
    try {
        const { email, role, platformAccess } = req.body;

        // Find user by email
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({ error: 'User with this email not found in the system' });
        }

        const newMember = new EventMember({
            eventId: req.params.eventId,
            userId: userToInvite._id,
            role: role || 'agent',
            platformAccess: platformAccess || []
        });

        await newMember.save();

        // Return populated data
        const populatedMember = await EventMember.findById(newMember._id).populate('userId', 'username email');
        res.status(201).json(populatedMember);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User is already a team member' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT update team member access/role
router.put('/:memberId', async (req, res) => {
    try {
        const { role, platformAccess } = req.body;
        const member = await EventMember.findOneAndUpdate(
            { _id: req.params.memberId, eventId: req.params.eventId },
            { $set: { role, platformAccess } },
            { new: true }
        ).populate('userId', 'username email');

        if (!member) return res.status(404).json({ error: 'Member not found' });
        res.json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE remove team member
router.delete('/:memberId', async (req, res) => {
    try {
        const member = await EventMember.findOneAndDelete({ _id: req.params.memberId, eventId: req.params.eventId });
        if (!member) return res.status(404).json({ error: 'Member not found' });
        res.json({ message: 'Team member removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
