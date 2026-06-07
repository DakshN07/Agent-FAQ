const { MistralAIEmbeddings } = require('@langchain/mistralai');

let embeddingsModel = null;
const apiKey = process.env.MISTRAL_API_KEY;

if (apiKey) {
  embeddingsModel = new MistralAIEmbeddings({
    apiKey: apiKey,
    modelName: "mistral-embed"
  });
} else {
  console.warn("⚠️ MISTRAL_API_KEY is not set. AI embedding features will be disabled.");
}

async function getEmbedding(text) {
  if (!embeddingsModel) {
    console.warn("⚠️ Attempted to generate embedding without MISTRAL_API_KEY.");
    return null;
  }

  try {
    const embedding = await embeddingsModel.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    return null;
  }
}

module.exports = { getEmbedding };