import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { openShift, closeShift } from '../services/shiftService.js';

export const getShifts = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { status } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    const shifts = await prisma.shift.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
        shiftMeters: { include: { pump: true } },
        _count: { select: { sales: true } },
      },
    });

    return successResponse(res, shifts);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const startShift = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    if (!stationId) return errorResponse(res, 'Station ID required', 400);

    const shift = await openShift({
      ...req.body,
      stationId,
      currentUser: req.user,
    });

    return successResponse(res, shift, 'Shift opened successfully.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const endShift = async (req, res) => {
  try {
    const { id } = req.params;
    const closed = await closeShift({
      shiftId: id,
      ...req.body,
      currentUser: req.user,
    });

    return successResponse(res, closed, 'Shift closed and cash reconciled successfully.');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
