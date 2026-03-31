const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateOnboardingFAQs = async (eventInfo) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are an AI assistant helping an event manager set up a new event platform called Agent-FAQ.
        The event is named: "${eventInfo.name}".
        Description: "${eventInfo.description}".

        Additional Details:
        - Website: ${eventInfo.websiteUrl || 'Not provided'}
        - Instagram: ${eventInfo.instagramHandle || 'Not provided'}
        - Contact Number: ${eventInfo.contactNumber || 'Not provided'}
        - Appointment/Booking Link: ${eventInfo.appointmentLink || 'Not provided'}

        Please generate a list of 10 highly probable, common Frequently Asked Questions (FAQs) that attendees or participants might have about this event. Provide realistic answers for them. 
        If the Additional Details above contain actual links or numbers, ensure you explicitly create FAQs where the answer provides those exact links/numbers (e.g., "How do I book a meeting?" -> "You can book here: [link]").
        
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

const generateEventDescription = async (details) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const { name, date, startTime, endTime, location, prizes, theme } = details;

        const prompt = `
        You are a talented, professional copywriter helping an event manager create an enthusiastic, emotionally engaging introduction paragraph for their new event platform called Agent-FAQ.
        The event is named: "${name}".
        
        Use the following raw details to craft ONE beautifully written, exciting paragraph (around 4-6 sentences) describing the event. Make it sound appealing to potential attendees.
        
        Raw Details given by the organizer:
        - Date: ${date || 'TBD'}
        - Start Time: ${startTime || 'TBD'}
        - End Time: ${endTime || 'TBD'}
        - Location: ${location || 'TBD'}
        - Goodies / Prizes: ${prizes || 'None specified'}
        - Theme / Vibe: ${theme || 'None specified'}
        
        Important Rules:
        - Do NOT write a list or bullet points. It must be ONE single, cohesive paragraph.
        - Do NOT include any markdown formatting like bolding or italics in your response. Just plain text.
        - Ensure it captures the excitement and clearly communicates the vital info naturally.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("AI Description Generation Error:", error);
        // Fallback description
        return `Join us for ${details.name || 'our upcoming event'}, taking place on ${details.date || 'a date to be announced'} at ${details.location || 'a location to be announced'}. It's going to be a fantastic experience!`;
    }
};

module.exports = {
    generateOnboardingFAQs,
    generateEventDescription
};
