const express = require('express');
const router = express.Router({ mergeParams: true });
const Integration = require('../models/Integration');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

// Middleware to check event access (abstracted for brevity; assuming only manager/admin can configure)
const checkEventAdmin = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        if (event.managerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.use(authenticate, checkEventAdmin);

// Get integrations for an event
router.get('/', async (req, res) => {
    try {
        const integrations = await Integration.find({ eventId: req.params.eventId });
        res.json(integrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Configure an integration (Create or Update)
router.post('/', async (req, res) => {
    try {
        const { platform, credentials, isActive } = req.body;

        // Find existing or create new
        let integration = await Integration.findOne({ eventId: req.params.eventId, platform });

        if (integration) {
            integration.credentials = credentials;
            integration.isActive = isActive !== undefined ? isActive : integration.isActive;
        } else {
            integration = new Integration({
                eventId: req.params.eventId,
                platform,
                credentials,
                isActive
            });
        }

        await integration.save();
        res.json(integration);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
