const joi = require('joi');
require('dotenv').config();

const envVarsSchema = joi.object({
  NODE_ENV: joi.string().valid('production', 'development', 'test').default('development'),
  PORT: joi.number().default(3000),
  MONGO_URI: joi.string().required().description('Mongo DB URL'),
  JWT_SECRET: joi.string().required().description('JWT Secret Key'),
  REDIS_URL: joi.string().optional().description('Redis URL for cache/sessions'),
  SENTRY_DSN: joi.string().optional().description('Sentry DSN for error tracking')
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  console.error(`Config validation error: ${error.message}`);
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
    url: envVars.REDIS_URL
  },
  sentry: {
    dsn: envVars.SENTRY_DSN
  }
};
