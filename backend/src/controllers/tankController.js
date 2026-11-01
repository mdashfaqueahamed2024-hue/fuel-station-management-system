import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const getTanks = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const tanks = await prisma.tank.findMany({
      where: stationId ? { stationId, active: true } : { active: true },
      include: {
        fuelProduct: true,
        pumps: true,
      },
      orderBy: { tankNumber: 'asc' },
    });

    const enrichedTanks = tanks.map(t => {
      const cap = Number(t.capacityLiters);
      const stock = Number(t.currentStockLiters);
      const threshold = Number(t.lowStockThresholdLiters);
      const utilization = cap > 0 ? (stock / cap) * 100 : 0;
      return {
        ...t,
        currentStockLiters: stock,
        capacityLiters: cap,
        utilizationPercentage: Number(utilization.toFixed(1)),
        isLowStock: stock <= threshold,
        isNearFull: stock >= cap * 0.95,
      };
    });

    return successResponse(res, enrichedTanks);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { tankId, fuelProductId, adjustmentType, quantityLiters, reason, notes } = req.body;
    const qty = Number(quantityLiters);

    const result = await prisma.$transaction(async (tx) => {
      const tank = await tx.tank.findUnique({
        where: { id: tankId },
        include: { fuelProduct: true },
      });

      if (!tank) throw new Error('Tank not found.');

      const currentStock = Number(tank.currentStockLiters);
      let newStock = currentStock;

      if (adjustmentType === 'POSITIVE') {
        newStock += qty;
      } else {
        if (currentStock < qty) {
          throw new Error(`Cannot subtract ${qty} L. Only ${currentStock.toFixed(2)} L available.`);
        }
        newStock -= qty;
      }

      // Update tank stock
      await tx.tank.update({
        where: { id: tankId },
        data: { currentStockLiters: newStock },
      });

      // Create Stock Adjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          stationId: tank.stationId,
          tankId,
          fuelProductId,
          adjustmentType,
          quantityLiters: qty,
          reason,
          performedByUserId: req.user.id,
          notes,
        },
      });

      // Record Stock Movement
      await tx.stockMovement.create({
        data: {
          stationId: tank.stationId,
          tankId,
          fuelProductId,
          movementType: 'ADJUSTMENT',
          quantityLiters: adjustmentType === 'POSITIVE' ? qty : -qty,
          balanceAfterLiters: newStock,
          referenceId: adjustment.id,
          referenceType: 'ADJUSTMENT',
          notes: `Stock adjustment: ${adjustmentType} ${qty} L. Reason: ${reason}. ${notes || ''}`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          stationId: tank.stationId,
          userId: req.user.id,
          actorName: req.user.fullName,
          action: 'STOCK_ADJUST',
          entityType: 'Tank',
          entityId: tankId,
          beforeState: JSON.stringify({ stock: currentStock }),
          afterState: JSON.stringify({ stock: newStock, adjustmentType, qty, reason }),
          ipAddress: req.ip,
        },
      });

      return { adjustment, newStock };
    });

    return successResponse(res, result, 'Stock adjustment successfully applied.');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getStockMovements = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { tankId } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;
    if (tankId) where.tankId = tankId;

    const movements = await prisma.stockMovement.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        tank: true,
        fuelProduct: true,
      },
    });

    return successResponse(res, movements);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
