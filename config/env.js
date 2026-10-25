const joi = require('joi');
require('dotenv').config();
const { isPlausibleKey } = require('../services/mistralKey');

const envVarsSchema = joi.object({
  NODE_ENV: joi.string().valid('production', 'development', 'test').default('development'),
  PORT: joi.number().default(4000),
  MONGO_URI: joi.string().required().description('Mongo DB URL'),
  JWT_SECRET: joi.string().min(16).required().description('JWT Secret Key'),
  REDIS_URL: joi.string().allow('').optional().description('Redis URL for cache/sessions'),
  SENTRY_DSN: joi.string().allow('').optional().description('Sentry DSN for error tracking'),
  // Optional: users bring their own key via the dashboard (see services/mistralKey.js).
  // An empty value is legitimate and must not block boot.
  MISTRAL_API_KEY: joi.string().allow('').optional().description('Shared Mistral key (optional fallback)'),
  QDRANT_URL: joi.string().allow('').optional().description('Qdrant Vector DB URL'),
  QDRANT_API_KEY: joi.string().allow('').optional().description('Qdrant API key (required for Qdrant Cloud)'),
  CORS_ORIGINS: joi.string().allow('').optional().description('Comma-separated list of allowed CORS origins'),
  FRONTEND_URL: joi.string().allow('').optional().description('Public frontend base URL (for invite links, emails)'),
  // Optional AI providers (only Mistral is required for the core pipeline)
  GEMINI_API_KEY: joi.string().allow('').optional(),
  OPENAI_API_KEY: joi.string().allow('').optional(),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  console.error(`Config validation error: ${error.message}`);
  process.exit(1);
}

// Refuse to boot in production with the well-known placeholder secret.
if (envVars.NODE_ENV === 'production' && envVars.JWT_SECRET === 'your_super_secret_jwt_key') {
  console.error('Config validation error: JWT_SECRET must not use the default placeholder value in production');
  process.exit(1);
}

// MISTRAL_API_KEY is optional now that users bring their own key during
// onboarding (see services/mistralKey.js). The deployment key remains a
// fallback for self-hosting and CI, so warn instead of hard-failing — but do
// not stay silent when it is set to a placeholder, which silently disables
// every AI feature while the app still boots "healthy".
if (envVars.MISTRAL_API_KEY && !isPlausibleKey(envVars.MISTRAL_API_KEY)) {
  console.warn(
    '⚠️  MISTRAL_API_KEY is set to a placeholder value and will be ignored. ' +
    'Users can still add their own key from the dashboard, but the shared ' +
    'fallback key is inactive.'
  );
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_URI,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  sentry: {
    dsn: envVars.SENTRY_DSN,
  },
  qdrant: {
    url: envVars.QDRANT_URL || 'http://localhost:6333',
    apiKey: envVars.QDRANT_API_KEY || undefined,
  },
  mistral: {
    apiKey: envVars.MISTRAL_API_KEY,
  },
  frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: envVars.CORS_ORIGINS
    ? envVars.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [],
};
