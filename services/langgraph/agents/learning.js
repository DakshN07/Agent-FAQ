const { ChatMistralAI } = require('@langchain/mistralai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const Faq = require('../../../models/Faq');
const { getEmbedding } = require('../../embedding');
const { syncFaqVector } = require('../../vectorStore');

const learningPrompt = `You are a learning agent for a support platform.
Your job is to categorize and tag a new FAQ entry so it can be easily managed.
Given the Question and Answer, provide a JSON response with exactly two fields:
{
  "category": "A short 1-2 word category (e.g. Billing, Technical, Rules)",
  "tags": ["tag1", "tag2", "tag3"]
}`;

async function runLearningAgent(eventId, question, answer, sourcePlatform, adminId) {
  try {
    const model = new ChatMistralAI({ temperature: 0, modelName: "mistral-large-latest", responseFormat: { type: "json_object" } });
    
    // 1. Generate Metadata using LLM
    const response = await model.invoke([
      new SystemMessage(learningPrompt),
      new HumanMessage(`Question: ${question}\nAnswer: ${answer}`)
    ]);
    
    let metadata = { category: "General", tags: [] };
    try {
        metadata = JSON.parse(response.content);
    } catch (e) {
        console.error("Failed to parse learning agent JSON");
    }

    // 2. Generate Embedding
    const embedding = await getEmbedding(question);

    // 3. Save to MongoDB
    const newFaq = new Faq({
      eventId,
      question,
      answer,
      embedding, // keep in mongo for legacy or hybrid lookup
      category: metadata.category,
      tags: metadata.tags,
      platforms: [sourcePlatform],
      answeredBy: adminId
    });
    await newFaq.save();

    // 4. Sync to Qdrant Vector Database.
    //    The FAQ is already persisted in Mongo above, so a vector-store
    //    failure must not fail the whole request — but syncFaqVector logs &
    //    captures the error so it is never silent.
    await syncFaqVector(newFaq);

    return newFaq;
  } catch (err) {
    console.error("Learning Agent Error:", err);
    throw err;
  }
}

module.exports = { runLearningAgent };
