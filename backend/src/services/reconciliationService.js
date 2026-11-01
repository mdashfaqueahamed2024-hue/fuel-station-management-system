import prisma from '../config/db.js';

export const performStockReconciliation = async ({
  stationId,
  tankId,
  physicalMeasuredStock,
  notes = '',
  currentUser,
}) => {
  return await prisma.$transaction(async (tx) => {
    const tank = await tx.tank.findUnique({
      where: { id: tankId },
      include: { fuelProduct: true },
    });

    if (!tank) {
      throw new Error('Tank not found.');
    }

    // 1. Fetch last reconciliation date or fallback to 30 days ago
    const lastReconciliation = await tx.stockReconciliation.findFirst({
      where: { tankId },
      orderBy: { reconciliationDate: 'desc' },
    });

    const startDate = lastReconciliation
      ? lastReconciliation.reconciliationDate
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const openingStock = lastReconciliation
      ? Number(lastReconciliation.physicalMeasuredStock)
      : Number(tank.capacityLiters) * 0.8; // baseline

    // 2. Confirmed deliveries for this tank since startDate
    const deliveriesAggregate = await tx.delivery.aggregate({
      where: {
        destinationTankId: tankId,
        status: 'CONFIRMED',
        createdAt: { gte: startDate },
      },
      _sum: {
        receivedQuantityLiters: true,
      },
    });
    const deliveriesReceived = Number(deliveriesAggregate._sum.receivedQuantityLiters || 0);

    // 3. Sales deducted from this tank since startDate
    const salesAggregate = await tx.sale.aggregate({
      where: {
        tankId,
        paymentStatus: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      _sum: {
        quantityLiters: true,
      },
    });
    const salesDeducted = Number(salesAggregate._sum.quantityLiters || 0);

    // 4. Authorized stock adjustments for this tank since startDate
    const adjustments = await tx.stockAdjustment.findMany({
      where: {
        tankId,
        createdAt: { gte: startDate },
      },
    });

    let netAdjustments = 0;
    for (const adj of adjustments) {
      if (adj.adjustmentType === 'POSITIVE') {
        netAdjustments += Number(adj.quantityLiters);
      } else {
        netAdjustments -= Number(adj.quantityLiters);
      }
    }

    // 5. Authoritative Formula
    // Expected Closing Stock = Opening Stock + Confirmed Deliveries - Sales Sold + Net Adjustments
    const expectedClosingStock = openingStock + deliveriesReceived - salesDeducted + netAdjustments;
    const physicalStock = Number(physicalMeasuredStock);
    const varianceLiters = physicalStock - expectedClosingStock;
    const variancePercentage = expectedClosingStock > 0
      ? (varianceLiters / expectedClosingStock) * 100
      : 0;

    const isDiscrepancy = Math.abs(variancePercentage) > 0.5; // > 0.5% variance is flagged
    const status = isDiscrepancy ? 'DISCREPANCY' : 'BALANCED';

    // 6. Record reconciliation entry
    const record = await tx.stockReconciliation.create({
      data: {
        stationId: tank.stationId,
        tankId,
        openingStock,
        deliveriesReceived,
        salesDeducted,
        adjustments: netAdjustments,
        expectedClosingStock,
        physicalMeasuredStock: physicalStock,
        varianceLiters,
        variancePercentage,
        status,
        notes,
        reconciledByUserId: currentUser.id,
      },
      include: {
        tank: { include: { fuelProduct: true } },
      },
    });

    // 7. If discrepancy exists, register an Alert
    if (isDiscrepancy) {
      await tx.alert.create({
        data: {
          stationId: tank.stationId,
          alertType: 'STOCK_DISCREPANCY',
          severity: Math.abs(variancePercentage) > 2 ? 'CRITICAL' : 'HIGH',
          title: `Stock Reconciliation Discrepancy on ${tank.tankNumber}`,
          message: `Expected stock: ${expectedClosingStock.toFixed(2)} L, Dip reading: ${physicalStock.toFixed(2)} L (Variance: ${varianceLiters.toFixed(2)} L / ${variancePercentage.toFixed(2)}%). Investigation recommended.`,
          status: 'ACTIVE',
        },
      });
    }

    // 8. Update current tank stock to match physical dip reading
    await tx.tank.update({
      where: { id: tankId },
      data: { currentStockLiters: physicalStock },
    });

    // 9. Log audit
    await tx.auditLog.create({
      data: {
        stationId: tank.stationId,
        userId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'STOCK_RECONCILIATION',
        entityType: 'StockReconciliation',
        entityId: record.id,
        afterState: JSON.stringify({
          expected: expectedClosingStock,
          physical: physicalStock,
          varianceLiters,
          variancePercentage,
          status,
        }),
      },
    });

    return record;
  });
};
