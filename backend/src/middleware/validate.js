import { errorResponse } from '../utils/response.js';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return errorResponse(res, 'Validation error', 422, formattedErrors);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return errorResponse(res, 'Validation error', 422, formattedErrors);
    }
    req.query = result.data;
    next();
  };
};
