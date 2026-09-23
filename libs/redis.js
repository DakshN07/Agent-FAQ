const { createClient } = require('redis');
const config = require('../config/env');
const logger = require('../utils/logger');

// Shared Redis client so routes (e.g. auth caching) and server.js use the same
// instance without requiring '../server' (which creates a circular dependency).
let redisClient = null;

if (config.redis.url && process.env.NODE_ENV !== 'test') {
  redisClient = createClient({ url: config.redis.url });
  redisClient.connect().catch((err) => logger.error('Redis connect error', err));
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.on('ready', () => logger.info('✅ Redis Connected'));
}

module.exports = redisClient;