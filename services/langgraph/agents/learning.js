const { ChatMistralAI } = require('@langchain/mistralai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { QdrantClient } = require('@qdrant/js-client-rest');
const Faq = require('../../../models/Faq');
const { getEmbedding } = require('../../embedding');

// Assuming Qdrant is running locally via Docker Compose
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

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

    // 4. Save to Qdrant Vector Database
    try {
      await qdrant.upsert('faqs', {
        wait: true,
        points: [
          {
            id: newFaq._id.toString(), // Needs to be a valid UUID or uint64, Qdrant allows string UUIDs
            vector: embedding,
            payload: {
              eventId: eventId.toString(),
              question,
              answer,
              category: metadata.category,
              tags: metadata.tags
            }
          }
        ]
      });
    } catch (e) {
      console.warn("Failed to insert into Qdrant. Is it running?", e.message);
    }

    return newFaq;
  } catch (err) {
    console.error("Learning Agent Error:", err);
    throw err;
  }
}

module.exports = { runLearningAgent };
