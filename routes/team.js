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

const { sendTeamInvite } = require('../services/emailService');

// POST invite/add team member
router.post('/invite', async (req, res) => {
    try {
        const { email, role, platformAccess } = req.body;
        const orgName = req.event.name || "Agent-FAQ Organization"; // fallback name

        // Check if member already exists
        let member = await EventMember.findOne({ eventId: req.params.eventId, email });
        
        if (member) {
            if (member.status === 'Active') {
                return res.status(400).json({ error: 'User is already an active team member' });
            }
            // If pending or removed, update status to pending and re-send invite
            member.status = 'Pending';
            member.role = role || member.role;
            member.platformAccess = platformAccess || member.platformAccess;
            await member.save();
        } else {
            // Find if user already has an account to link it immediately, otherwise wait for signup
            const user = await User.findOne({ email });
            member = new EventMember({
                eventId: req.params.eventId,
                userId: user ? user._id : null,
                email: email,
                role: role || 'agent',
                status: 'Pending',
                platformAccess: platformAccess || []
            });
            await member.save();
        }

        // Send email
        const emailResult = await sendTeamInvite(email, orgName, req.params.eventId);
        if (!emailResult.success) {
            console.error("Failed to send invite email:", emailResult.error);
        }

        res.status(201).json({ message: 'Invitation sent successfully', member });
    } catch (error) {
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
        const member = await EventMember.findOneAndUpdate(
            { _id: req.params.memberId, eventId: req.params.eventId },
            { $set: { status: 'Removed' } },
            { new: true }
        );
        if (!member) return res.status(404).json({ error: 'Member not found' });
        res.json({ message: 'Team member removed', member });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
