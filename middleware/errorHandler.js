const logger = require('../utils/logger');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Normalise anything that lands here into a real Error. Express 5 rejects
  // thrown primitives (strings, plain objects) that lack a stack, which used
  // to produce a genuinely bare, contentless 500.
  if (!(err instanceof Error)) {
    const detail = typeof err === 'string' ? err : JSON.stringify(err);
    err = new Error(detail || 'Unknown error');
  }

  // body-parser and similar set `status` (not `statusCode`); respect either.
  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Something went wrong on our end.';

  // 5xx = our fault. Log with the stack so it is diagnosable, but never leak
  // internals (or the stack) to the client in production.
  const isServerError = statusCode >= 500;
  logger.error(
    `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    { stack: err.stack }
  );

  if (config.env === 'production' && isServerError) {
    message = 'Something went wrong on our end. Please try again.';
  }

  const response = {
    code: statusCode,
    // `error` mirrors `message` so the frontend's error extraction (which reads
    // `error` first) and ad-hoc curl/Postman users both get something useful.
    error: message,
    message,
    ...(config.env !== 'production' && !isServerError && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
