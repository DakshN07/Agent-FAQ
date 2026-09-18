module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.kilo/', '/frontend/', '/frontend-old/'],
  modulePathIgnorePatterns: ['<rootDir>/.kilo/', '<rootDir>/frontend-old/'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  testTimeout: 10000,
  // The @langchain/* and @qdrant packages are ESM-only and are not transformed
  // by jest's default (node_modules-ignoring) transformer. The unit tests don't
  // exercise real LLM/vector calls, so map those heavy ESM deps to lightweight
  // CJS stubs. Remove these mappings if/when a Babel/ESM transform is added.
  moduleNameMapper: {
    '^@langchain/mistralai$': '<rootDir>/tests/__mocks__/langchain-mistralai.js',
    '^@langchain/langgraph$': '<rootDir>/tests/__mocks__/langchain-langgraph.js',
    '^@langchain/core/messages$': '<rootDir>/tests/__mocks__/langchain-core-messages.js',
    '^@qdrant/js-client-rest$': '<rootDir>/tests/__mocks__/qdrant-client.js',
  },
};
