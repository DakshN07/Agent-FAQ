const { ChatMistralAI } = require('@langchain/mistralai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { searchSimilar } = require('../../vectorStore');
const { getEmbedding } = require('../../embedding');
const { normalizeThreshold } = require('../../../utils/threshold');
const logger = require('../../../utils/logger');
const Sentry = require('@sentry/node');

// No hardcoded answer threshold here — it is resolved per event by
// IntegrationManager (event.faqThreshold ?? global settings ?? 0.85) and
// carried through the workflow state as `state.faqThreshold`.

const faqPrompt = (context) => `You are a helpful customer support agent.
Answer the user's question using ONLY the provided context below.
If the context does not contain the answer, do NOT hallucinate. Simply respond with exactly: "UNKNOWN".

Context:
${context}`;

async function faqNode(state) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage.content;
  const threshold = normalizeThreshold(state.faqThreshold);

  const escalate = {
    finalAnswer: "I couldn't find a verified answer. This question has been forwarded to the support team.",
    confidenceScore: 0.0,
  };

  try {
    // 1. Get embedding for the user's query
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) {
      // Loud failure: missing/misconfigured MISTRAL_API_KEY etc. Log & capture
      // so it is distinguishable from a genuine "no match".
      const err = new Error('Failed to generate query embedding (is MISTRAL_API_KEY configured?)');
      logger.error(`[faq_agent] ${err.message} for event ${state.eventId}`);
      Sentry.captureException(err);
      return escalate;
    }

    // 2. Search Qdrant for similar FAQs. Failures are loud: searchSimilar
    //    logs + captures the error and rethrows.
    let searchResult;
    try {
      searchResult = await searchSimilar(state.eventId, queryEmbedding, 3);
    } catch (err) {
      // The vector store is unavailable — do not silently pretend we looked.
      logger.error(`[faq_agent] Qdrant search unavailable for event ${state.eventId}: ${err.message}`);
      Sentry.captureException(err);
      return escalate;
    }

    const bestMatch = searchResult[0];
    let finalAnswer = null;
    let confidence = 0.0;

    // 3. RAG / Confidence Check using the event-resolved threshold
    if (bestMatch && bestMatch.score >= threshold) {
      confidence = bestMatch.score;
      const contextText = searchResult
        .filter((r) => r.score >= threshold)
        .map((r) => `Q: ${r.payload.question}\nA: ${r.payload.answer}`)
        .join('\n\n');

      const model = new ChatMistralAI({ temperature: 0, modelName: 'mistral-large-latest' });
      const response = await model.invoke([
        new SystemMessage(faqPrompt(contextText)),
        new HumanMessage(query),
      ]);

      finalAnswer = response.content.trim();

      if (finalAnswer === 'UNKNOWN') {
        finalAnswer = escalate.finalAnswer;
        confidence = 0.0;
      }
    } else {
      finalAnswer = escalate.finalAnswer;
    }

    return {
      finalAnswer,
      confidenceScore: confidence,
    };
  } catch (err) {
    logger.error(`[faq_agent] Unexpected error for event ${state.eventId}: ${err.message}`);
    Sentry.captureException(err);
    return {
      finalAnswer: "I'm currently experiencing technical difficulties processing your request.",
      confidenceScore: 0.0,
    };
  }
}

module.exports = { faqNode };