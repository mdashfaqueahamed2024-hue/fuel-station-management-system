import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  errorResponse(res, `Resource not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  // Handle Prisma unique constraint error (P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target})` : '';
    return errorResponse(res, `A duplicate record already exists with that value${target}.`, 409);
  }

  // Handle Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found in database.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error occurred.'
    : err.message || 'An unexpected error occurred.';

  errorResponse(res, message, statusCode, config.nodeEnv === 'development' ? { stack: err.stack } : null);
};
