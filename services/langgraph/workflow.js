const { StateGraph, END } = require('@langchain/langgraph');
const { StateChannels } = require('./state');
const { moderationNode } = require('./agents/moderation');
const { supervisorNode } = require('./agents/supervisor');
const { faqNode } = require('./agents/faq');
const { analyticsNode } = require('./agents/analytics');

/**
 * Define the State Graph for the Support Platform
 */
function createSupportWorkflow() {
  const workflow = new StateGraph({ channels: StateChannels });

  // Add nodes
  workflow.addNode("moderation", moderationNode);
  workflow.addNode("supervisor", supervisorNode);
  workflow.addNode("faq_agent", faqNode);
  workflow.addNode("analytics_agent", analyticsNode);

  // Set Entry Point
  workflow.setEntryPoint("moderation");

  // Edges
  // Moderation -> Supervisor or END
  workflow.addConditionalEdges("moderation", 
    (state) => state.isFlagged ? "flagged" : "clean",
    {
        "flagged": END,
        "clean": "supervisor"
    }
  );

  // Supervisor -> Specialized Agents
  workflow.addConditionalEdges("supervisor", 
    (state) => state.nextAgent,
    {
        "faq_agent": "faq_agent",
        "analytics_agent": "analytics_agent",
        "END": END
    }
  );

  // Specialized Agents -> END
  workflow.addEdge("faq_agent", END);
  workflow.addEdge("analytics_agent", END);

  return workflow.compile();
}

module.exports = { createSupportWorkflow };
