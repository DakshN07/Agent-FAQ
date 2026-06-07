const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const Analytics = require('../../../models/Analytics');

const analyticsPrompt = (data) => `You are an analytics agent for a customer support platform.
An admin has asked a question about the platform's support activity.
Use the following raw JSON data to answer their question clearly and concisely.

Raw Data:
${data}`;

async function analyticsNode(state) {
  const model = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o" });
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  try {
    // Fetch recent analytics from DB
    const recentAnalytics = await Analytics.find({ eventId: state.eventId })
        .sort({ date: -1 })
        .limit(30)
        .lean();

    const response = await model.invoke([
        new SystemMessage(analyticsPrompt(JSON.stringify(recentAnalytics))),
        new HumanMessage(lastMessage.content)
    ]);

    return { 
        finalAnswer: response.content,
        confidenceScore: 1.0 // Always high confidence for analytics since it's admin facing
    };
  } catch (err) {
    console.error("Analytics Node Error:", err);
    return {
        finalAnswer: "I'm sorry, I encountered an error retrieving the analytics data.",
        confidenceScore: 0.0
    };
  }
}

module.exports = { analyticsNode };
