// Jest CJS stub for the ESM-only @langchain/mistralai package.
// The unit tests exercise route validation and health only — they never make
// real LLM/embedding calls — so these classes just need to be constructible.
class ChatMistralAI {
  constructor(opts = {}) {
    this.opts = opts;
  }
  async invoke() {
    return { content: 'SAFE' };
  }
}

class MistralAIEmbeddings {
  constructor(opts = {}) {
    this.opts = opts;
  }
  async embedQuery() {
    return new Array(1024).fill(0);
  }
  async embedDocuments(texts = []) {
    return texts.map(() => new Array(1024).fill(0));
  }
}

module.exports = { ChatMistralAI, MistralAIEmbeddings };
