const joi = require('joi');
require('dotenv').config();

const envVarsSchema = joi.object({
  NODE_ENV: joi.string().valid('production', 'development', 'test').default('development'),
  PORT: joi.number().default(3000),
  MONGO_URI: joi.string().required().description('Mongo DB URL'),
  JWT_SECRET: joi.string().min(16).required().description('JWT Secret Key'),
  REDIS_URL: joi.string().allow('').optional().description('Redis URL for cache/sessions'),
  SENTRY_DSN: joi.string().allow('').optional().description('Sentry DSN for error tracking'),
  MISTRAL_API_KEY: joi.string().required().description('Mistral Key for LangGraph Agents'),
  QDRANT_URL: joi.string().allow('').optional().description('Qdrant Vector DB URL'),
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
  },
  mistral: {
    apiKey: envVars.MISTRAL_API_KEY,
  },
  frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: envVars.CORS_ORIGINS
    ? envVars.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [],
};
