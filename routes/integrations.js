const express = require('express');
const router = express.Router({ mergeParams: true });
const Integration = require('../models/Integration');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

// Middleware to check event ownership
const checkEventOwnership = async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, managerId: req.user.id });
        if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });
        req.event = event;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.use(authenticate, checkEventOwnership);

// Get integrations for event
router.get('/', async (req, res) => {
    try {
        const integrations = await Integration.find({ eventId: req.params.eventId });
        res.json(integrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add integration
router.post('/', async (req, res) => {
    try {
        const { platform, credentials, channelMappings } = req.body;
        const integration = new Integration({
            eventId: req.params.eventId,
            platform,
            credentials,
            channelMappings
        });
        await integration.save();
        res.status(201).json(integration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update integration
router.put('/:platform', async (req, res) => {
    try {
        const integration = await Integration.findOneAndUpdate(
            { eventId: req.params.eventId, platform: req.params.platform },
            { $set: req.body },
            { new: true }
        );
        if (!integration) return res.status(404).json({ error: 'Integration not found' });
        res.json(integration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete integration
router.delete('/:platform', async (req, res) => {
    try {
        const integration = await Integration.findOneAndDelete({ eventId: req.params.eventId, platform: req.params.platform });
        if (!integration) return res.status(404).json({ error: 'Integration not found' });
        res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
