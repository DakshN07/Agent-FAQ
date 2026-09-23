const vectorStore = require('../services/vectorStore');

describe('vectorStore', () => {
  describe('faqIdToUuid', () => {
    it('turns a Mongo ObjectId hex string into a valid, deterministic UUID', () => {
      const hex = '507f1f77bcf86cd799439011';
      const uuid = vectorStore.faqIdToUuid(hex);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      // Deterministic: same input -> same UUID.
      expect(vectorStore.faqIdToUuid(hex)).toBe(uuid);
      // Different input -> different UUID.
      expect(vectorStore.faqIdToUuid('507f1f77bcf86cd799439012')).not.toBe(uuid);
    });
  });

  describe('upsertFaq', () => {
    it('upserts a point with the mocked client (collection auto-created)', async () => {
      await expect(
        vectorStore.upsertFaq({
          id: '507f1f77bcf86cd799439011',
          vector: [0.1, 0.2, 0.3],
          payload: { eventId: 'evt1', question: 'Hi', answer: 'Hello' },
        })
      ).resolves.toBeUndefined();
    });

    it('rejects an upsert without a valid embedding vector', async () => {
      await expect(vectorStore.upsertFaq({ id: 'abc', vector: [], payload: {} })).rejects.toThrow(
        /valid embedding vector/
      );
    });
  });

  describe('getHealth', () => {
    it('reports an ok status through the mocked client', async () => {
      const health = await vectorStore.getHealth();
      expect(health).toHaveProperty('status');
      expect(health.collection).toBe('faqs');
      expect(health.exists).toBe(false);
    });
  });
});