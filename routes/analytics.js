const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const UnknownQuestion = require('../models/UnknownQuestion');
const Faq = require('../models/Faq');

router.get('/', async (req, res) => {
    try {
        const eventId = req.query.eventId;
        const query = eventId && eventId !== 'undefined' ? { eventId } : {};

        // Aggregate stats
        const faqsCount = await Faq.countDocuments(query);
        const unknownsCount = await UnknownQuestion.countDocuments(query);

        // Sum matched and unmatched from Analytics table
        const analytics = await Analytics.find(query);
        const matched = analytics.reduce((sum, a) => sum + (a.matched || 0), 0);
        const unmatched = analytics.reduce((sum, a) => sum + (a.unmatched || 0), 0);
        const totalQueries = matched + unmatched;

        // Get top unknown questions
        const pendingQuestions = await UnknownQuestion.find(query)
            .sort({ count: -1 })
            .limit(10)
            .map(items => items.map(q => ({
                question: q.text,
                count: q.count,
                eventId: q.eventId,
                sourcePlatform: q.sourcePlatform
            })));

        // Placeholder chart data
        const chartData = [
            { name: 'Mon', queries: Math.floor(totalQueries / 7) },
            { name: 'Tue', queries: Math.floor(totalQueries / 7) },
            { name: 'Wed', queries: Math.floor(totalQueries / 7) },
            { name: 'Thu', queries: Math.floor(totalQueries / 7) },
            { name: 'Fri', queries: Math.floor(totalQueries / 7) },
            { name: 'Sat', queries: Math.floor(totalQueries / 7) },
            { name: 'Sun', queries: Math.floor(totalQueries / 7) }
        ];

        res.json({
            totalFaqs: faqsCount,
            totalUnknown: unknownsCount,
            matched,
            unmatched,
            totalQueries,
            uniqueUsers: 0,
            accuracy: totalQueries > 0 ? ((matched / totalQueries) * 100).toFixed(2) : 0,
            chartData,
            pendingQuestions,
            system: {
                description: "MongoDB Analytics",
                matchedDescription: "Based on recorded events",
                unmatchedDescription: "Based on recorded unknown questions"
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
