import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { scanStationAnomalies } from '../services/anomalyService.js';

export const getStationAnomalies = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    if (!stationId) {
      return errorResponse(res, 'Station ID required', 400);
    }

    const anomalies = await scanStationAnomalies(stationId);
    return successResponse(res, anomalies);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getAlerts = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { status } = req.query; // ACTIVE or RESOLVED

    const where = {};
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse(res, alerts);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByUserId: req.user.id,
      },
    });

    return successResponse(res, alert, 'Alert marked as RESOLVED.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
