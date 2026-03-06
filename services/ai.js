const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateOnboardingFAQs = async (eventName, eventDescription) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an AI assistant helping an event manager set up a new event platform called Agent-FAQ.
        The event is named: "${eventName}".
        Description: "${eventDescription}".

        Please generate a list of 10 highly probable, common Frequently Asked Questions (FAQs) that attendees or participants might have about this event. Provide realistic answers for them.
        
        Return the response strictly as a JSON array of objects, where each object has "question" and "answer" properties. Do not include markdown formatting or any other text outside the JSON array.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up markdown block if present
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

        return JSON.parse(jsonStr.trim());
    } catch (error) {
        console.error("AI Generation Error:", error);
        // Fallback if AI fails or formatting is wrong
        return [
            { question: "What dates will the event run?", answer: "The specific dates are still being finalized." },
            { question: "Where is the event located?", answer: "Please check the main event website for venue details." },
            { question: "How much are tickets?", answer: "Ticket pricing will be announced soon." },
            { question: "Will there be remote options?", answer: "We are considering hybrid options." },
            { question: "How do I volunteer?", answer: "Reach out to the organizers directly for volunteer opportunities." }
        ];
    }
};

module.exports = {
    generateOnboardingFAQs
};
