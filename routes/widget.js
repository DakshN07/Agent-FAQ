const express = require('express');
const router = express.Router();
const integrationManager = require('../services/IntegrationManager');
const Event = require('../models/Event');

// Get Widget Settings (Color, Name, etc.)
router.get('/settings/:eventId', async (req, res) => {
    try {
        if (!req.params.eventId || req.params.eventId === 'null' || req.params.eventId === 'undefined') {
            return res.status(400).json({ error: 'Valid Event ID is required' });
        }
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        
        res.json({
            name: event.name || 'Agent',
            themeColor: '#3b82f6', // Default blue, can be customized later
            botName: event.name ? `${event.name} FAQ Agent` : 'FAQ Agent'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle incoming chat from Widget
router.post('/chat/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { text, userId } = req.body || {}; // userId is a unique session ID from the browser

        if (!eventId || eventId === 'null' || eventId === 'undefined') return res.status(400).json({ error: 'Valid Event ID is required' });
        if (!text) return res.status(400).json({ error: 'Message text is required' });
        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        // Normalize message for IntegrationManager
        const normalizedMsg = {
            eventId,
            sourcePlatform: 'web',
            channelId: userId, // For web, channel is just the user session
            userId: userId,
            text: text
        };

        // Call the unified handler
        const result = await integrationManager.handleIncomingMessage(normalizedMsg);
        
        res.json({ 
            success: true, 
            reply: result ? result.answer : "I couldn't process that right now." 
        });

    } catch (error) {
        console.error("Widget chat error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
