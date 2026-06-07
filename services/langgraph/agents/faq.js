const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { QdrantClient } = require('@qdrant/js-client-rest');

// Assuming Qdrant is running locally via Docker Compose
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

const THRESHOLD = 0.85;

const faqPrompt = (context) => `You are a helpful customer support agent.
Answer the user's question using ONLY the provided context below.
If the context does not contain the answer, do NOT hallucinate. Simply respond with exactly: "UNKNOWN".

Context:
${context}`;

async function faqNode(state) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage.content;

  try {
    // 1. Get embedding for the user's query
    // We'll use the existing embedding service (assuming it's updated to use OpenAI embeddings)
    const { getEmbedding } = require('../../embedding');
    const queryEmbedding = await getEmbedding(query);

    // 2. Search Qdrant for similar FAQs
    // We assume a collection named 'faqs' exists and is synced
    let searchResult = [];
    try {
        searchResult = await qdrant.search('faqs', {
            vector: queryEmbedding,
            limit: 3,
            filter: {
                must: [
                    { key: "eventId", match: { value: state.eventId.toString() } }
                ]
            }
        });
    } catch(e) {
        console.log("Qdrant collection might not exist yet or connection failed:", e.message);
    }

    const bestMatch = searchResult[0];
    let finalAnswer = null;
    let confidence = 0.0;

    // 3. RAG / Confidence Check
    if (bestMatch && bestMatch.score >= THRESHOLD) {
        confidence = bestMatch.score;
        // Construct context from top results
        const contextText = searchResult
            .filter(r => r.score >= THRESHOLD)
            .map(r => `Q: ${r.payload.question}\nA: ${r.payload.answer}`)
            .join('\n\n');

        const model = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o-mini" });
        const response = await model.invoke([
            new SystemMessage(faqPrompt(contextText)),
            new HumanMessage(query)
        ]);

        finalAnswer = response.content.trim();
        
        if (finalAnswer === "UNKNOWN") {
             finalAnswer = "I couldn't find a verified answer. This question has been forwarded to the support team.";
             confidence = 0.0;
        }
    } else {
        finalAnswer = "I couldn't find a verified answer. This question has been forwarded to the support team.";
    }

    return { 
        finalAnswer,
        confidenceScore: confidence
    };

  } catch (err) {
    console.error("FAQ Node Error:", err);
    return {
        finalAnswer: "I'm currently experiencing technical difficulties processing your request.",
        confidenceScore: 0.0
    };
  }
}

module.exports = { faqNode };
