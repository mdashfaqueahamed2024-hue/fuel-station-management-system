import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { performStockReconciliation } from '../services/reconciliationService.js';

export const getReconciliations = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { tankId } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;
    if (tankId) where.tankId = tankId;

    const history = await prisma.stockReconciliation.findMany({
      where,
      orderBy: { reconciliationDate: 'desc' },
      take: 50,
      include: {
        tank: { include: { fuelProduct: true } },
      },
    });

    return successResponse(res, history);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const executeReconciliation = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    const { tankId, physicalMeasuredStock, notes } = req.body;

    const result = await performStockReconciliation({
      stationId,
      tankId,
      physicalMeasuredStock,
      notes,
      currentUser: req.user,
    });

    return successResponse(
      res,
      result,
      `Stock reconciliation completed. Status: ${result.status} (Variance: ${result.varianceLiters.toFixed(2)} L).`
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
