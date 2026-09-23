// Jest CJS stub for the ESM-only @qdrant/js-client-rest package.
class QdrantClient {
  constructor(opts = {}) {
    this.opts = opts;
  }
  async search() {
    return [];
  }
  async upsert() {
    return { status: 'ok' };
  }
  async getCollections() {
    return { collections: [] };
  }
  async createCollection() {
    return true;
  }
  async count() {
    return { count: 0 };
  }
}

module.exports = { QdrantClient };
