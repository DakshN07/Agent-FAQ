const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

const supervisorPrompt = `You are a supervisor agent in a customer support platform.
Your job is to route incoming user messages to the appropriate specialized agent.
The available agents are:
- faq_agent: Use this for answering customer questions about products, services, rules, or general inquiries.
- analytics_agent: Use this ONLY if the user is an admin asking about platform statistics, charts, or summaries.

Return ONLY the name of the next agent to route to. Do not include any other text.`;

async function supervisorNode(state) {
  const model = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o-mini" });
  
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // If the state is already flagged by moderation, skip and end.
  if (state.isFlagged) {
    return { nextAgent: "END" };
  }

  const response = await model.invoke([
    new SystemMessage(supervisorPrompt),
    new HumanMessage(lastMessage.content)
  ]);
  
  let nextAgent = response.content.trim().toLowerCase();
  
  if (!['faq_agent', 'analytics_agent'].includes(nextAgent)) {
    nextAgent = 'faq_agent'; // Default fallback
  }

  return { nextAgent };
}

module.exports = { supervisorNode };
