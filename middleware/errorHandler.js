const logger = require('../utils/logger');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = 500;
  }

  // Log the error
  if (config.env === 'production' && statusCode === 500) {
    logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { stack: err.stack });
    // Don't leak stack traces to the user in production
    message = 'Internal Server Error';
  } else {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { stack: err.stack });
  }

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).send(response);
};

module.exports = errorHandler;
