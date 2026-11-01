import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const getFuelProducts = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const fuels = await prisma.fuelProduct.findMany({
      where: stationId ? { stationId, active: true } : { active: true },
      include: {
        tanks: true,
      },
    });
    return successResponse(res, fuels);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const updateFuelPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPrice, costPrice } = req.body;

    const oldFuel = await prisma.fuelProduct.findUnique({ where: { id } });
    if (!oldFuel) {
      return errorResponse(res, 'Fuel product not found', 404);
    }

    const updated = await prisma.fuelProduct.update({
      where: { id },
      data: {
        currentPrice: Number(currentPrice),
        costPrice: costPrice !== undefined ? Number(costPrice) : oldFuel.costPrice,
      },
    });

    await logAudit({
      stationId: oldFuel.stationId,
      userId: req.user.id,
      actorName: req.user.fullName,
      action: 'PRICE_UPDATE',
      entityType: 'FuelProduct',
      entityId: id,
      beforeState: { currentPrice: oldFuel.currentPrice, costPrice: oldFuel.costPrice },
      afterState: { currentPrice: updated.currentPrice, costPrice: updated.costPrice },
      ipAddress: req.ip,
    });

    return successResponse(res, updated, `Fuel price for ${updated.name} updated to ₹${updated.currentPrice}/L.`);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
