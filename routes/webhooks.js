const express = require('express');
const router = express.Router();
const integrationManager = require('../services/IntegrationManager');

// Slack Webhook Receiver
// URL should be /api/webhooks/slack/:eventId
router.post('/slack/:eventId', async (req, res) => {
    const eventId = req.params.eventId;

    // Check challenge for setup
    if (req.body.type === 'url_verification') {
        return res.json({ challenge: req.body.challenge });
    }

    try {
        const adapter = integrationManager.getAdapter(eventId, 'slack');
        if (!adapter) {
            return res.status(404).send('Slack integration not active for this event');
        }

        const normalizedMsg = adapter.parseWebhook(req.body);
        if (normalizedMsg) {
            // Fire and forget handles it asynchronously
            integrationManager.handleIncomingMessage(normalizedMsg).catch(console.error);
        }

        res.status(200).send('OK'); // Always ACK slack immediately
    } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
