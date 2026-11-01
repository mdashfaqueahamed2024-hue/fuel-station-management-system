import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';

export const getAuditLogs = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { action, entityType, limit = 50, page = 1 } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return successResponse(res, {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
