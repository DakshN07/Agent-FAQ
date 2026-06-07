const { BaseMessage } = require('@langchain/core/messages');

/**
 * Represents the state of our multi-agent workflow
 */
const StateChannels = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
  conversationId: null,
  userId: null,
  eventId: null,
  platform: null,
  sentiment: null,
  
  // Routing & execution flags
  nextAgent: null,
  isFlagged: false,
  confidenceScore: 0.0,
  finalAnswer: null,
  
  // Moderation context
  spamScore: 0,
  toxicityType: null
};

module.exports = { StateChannels };
