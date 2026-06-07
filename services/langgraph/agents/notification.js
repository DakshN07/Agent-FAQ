// A simple utility agent to push notifications to an admin webhook

async function notifyAdmin(message, webhookUrl) {
    if (!webhookUrl) return;
    try {
        const fetch = (await import('node-fetch')).default;
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (e) {
        console.warn("Notification Agent failed to send alert:", e.message);
    }
}

module.exports = { notifyAdmin };
