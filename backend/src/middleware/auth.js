import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { errorResponse } from '../utils/response.js';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. No token provided.', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        stationId: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      return errorResponse(res, 'User account not found or deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token.', 401);
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' does not have sufficient permissions.`,
        403
      );
    }

    next();
  };
};

export const resolveStation = (req) => {
  // If user is ADMIN, they can provide a stationId query/param or fallback to their own
  const requestedStation = req.query.stationId || req.headers['x-station-id'] || req.body.stationId;
  if (req.user.role === 'ADMIN' && requestedStation) {
    return requestedStation;
  }
  return req.user.stationId;
};
