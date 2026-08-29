const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
const Sentry = require('@sentry/node');
const config = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

// Initialize Sentry if DSN is provided.
// NOTE: @sentry/node v8+ removed Sentry.Handlers; instrumentation is set up
// via Sentry.init() here and Sentry.setupExpressErrorHandler(app) below.
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.env === 'production' ? 0.2 : 1.0,
  });
}

// Security Middleware
app.use(helmet());

// CORS: in production, only allow explicitly configured origins (CORS_ORIGINS).
const corsOptions = {
  origin:
    config.env === 'production'
      ? (config.corsOrigins.length ? config.corsOrigins : false)
      : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
if (config.env === 'production' && config.corsOrigins.length === 0) {
  logger.warn('⚠️  CORS_ORIGINS is not set in production; all cross-origin browser requests will be blocked.');
}
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks

// Redis Client
let redisClient;
if (config.redis.url) {
  redisClient = createClient({
    url: config.redis.url
  });
  
  redisClient.connect().catch(console.error);
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.on('ready', () => logger.info('✅ Redis Connected'));
}

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
  }),
});
app.use('/api/', apiLimiter);

// Import Routes
let routes;
let authRoutes;
let integrationManager;
try {
  routes = require('./routes/index');
  authRoutes = require('./routes/auth');
  integrationManager = require('./services/IntegrationManager');
} catch (error) {
  logger.warn('Some routes or services failed to load. Make sure they exist:', error.message);
}

// Connect to MongoDB with pooling and retry
const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await mongoose.connect(config.mongoose.url, {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      logger.info(`✅ MongoDB Connected to ${config.mongoose.url}`);
      
      if (integrationManager) {
        await integrationManager.loadIntegrations();
      }
      break;
    } catch (err) {
      logger.error(`❌ MongoDB Connection Error: ${err.message}. Retries left: ${retries - 1}`);
      retries -= 1;
      // wait 5 seconds before retrying
      await new Promise(res => setTimeout(res, 5000));
      if (retries === 0) {
        logger.error('Failed to connect to MongoDB after 5 attempts. Exiting...');
        process.exit(1);
      }
    }
  }
};
connectDB();

// Use Routes
if (routes) app.use('/api', routes);
if (authRoutes) app.use('/api/auth', authRoutes);

// Swagger API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  if (dbStatus !== 'connected') {
    return res.status(503).json({ status: 'error', database: dbStatus, uptime: process.uptime() });
  }
  res.status(200).json({ status: 'ok', database: dbStatus, uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Sentry error handler must be registered before any other error middleware.
// v8+ API: attaches its own Express error handler to the app.
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Global Error Handler
app.use(errorHandler);

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, () => {
    logger.info(`🚀 API Server running in ${config.env} mode on port ${config.port}`);
  });
}

// Graceful Shutdown
const gracefulShutdown = () => {
  logger.info('SIGTERM/SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
module.exports.redisClient = redisClient;
