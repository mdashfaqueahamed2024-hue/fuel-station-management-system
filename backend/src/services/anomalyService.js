import prisma from '../config/db.js';

export const scanStationAnomalies = async (stationId) => {
  const anomalies = [];

  // Rule 1: Cash variance during shift closure > ₹500 or < -₹500
  const recentShifts = await prisma.shift.findMany({
    where: {
      stationId,
      status: 'CLOSED',
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { employee: true },
  });

  for (const shift of recentShifts) {
    const variance = Number(shift.cashVariance || 0);
    if (Math.abs(variance) >= 500) {
      anomalies.push({
        type: 'CASH_VARIANCE_ANOMALY',
        severity: Math.abs(variance) > 2000 ? 'HIGH' : 'MEDIUM',
        title: `Significant Cash Variance in Shift (${shift.shiftName})`,
        explanation: `Shift closed by ${shift.employee?.fullName || 'employee'} recorded an expected cash of ₹${Number(shift.expectedCash).toFixed(2)} vs actual cash ₹${Number(shift.actualCash).toFixed(2)}, leaving a variance of ₹${variance.toFixed(2)}. Flagged for managerial audit.`,
        referenceId: shift.id,
        createdAt: shift.endTime || shift.createdAt,
      });
    }
  }

  // Rule 2: Unusually large stock adjustments (> 500 Liters)
  const recentAdjustments = await prisma.stockAdjustment.findMany({
    where: { stationId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { fuelProduct: true, tank: true },
  });

  for (const adj of recentAdjustments) {
    const qty = Number(adj.quantityLiters || 0);
    if (qty >= 500) {
      anomalies.push({
        type: 'LARGE_STOCK_ADJUSTMENT',
        severity: 'HIGH',
        title: `Unusually Large Stock Adjustment: ${qty.toFixed(2)} L`,
        explanation: `A manual ${adj.adjustmentType} adjustment of ${qty.toFixed(2)} Liters on ${adj.tank.tankNumber} (${adj.fuelProduct.name}) was registered under reason "${adj.reason}". Discrepancies above 500 L require mandatory supervisor sign-off.`,
        referenceId: adj.id,
        createdAt: adj.createdAt,
      });
    }
  }

  // Rule 3: Tank Stock below zero or below Low-Stock Threshold
  const tanks = await prisma.tank.findMany({
    where: { stationId, active: true },
    include: { fuelProduct: true },
  });

  for (const tank of tanks) {
    const stock = Number(tank.currentStockLiters);
    const capacity = Number(tank.capacityLiters);
    const threshold = Number(tank.lowStockThresholdLiters);

    if (stock <= 0) {
      anomalies.push({
        type: 'DEPLETED_TANK_ANOMALY',
        severity: 'CRITICAL',
        title: `Tank ${tank.tankNumber} Stock Depleted (0 L)`,
        explanation: `Tank ${tank.tankNumber} holding ${tank.fuelProduct.name} has zero or negative physical inventory. Dispensing must halt to avoid pump cavitation.`,
        referenceId: tank.id,
        createdAt: new Date(),
      });
    } else if (stock <= threshold) {
      anomalies.push({
        type: 'LOW_STOCK_WARNING',
        severity: 'HIGH',
        title: `Low Stock: Tank ${tank.tankNumber} (${stock.toFixed(2)} L left)`,
        explanation: `Available volume is below safe operating threshold (${threshold.toFixed(2)} L). Tank utilization is at ${((stock / capacity) * 100).toFixed(1)}%. Recommend re-ordering immediately.`,
        referenceId: tank.id,
        createdAt: new Date(),
      });
    } else if (stock > capacity * 0.95) {
      anomalies.push({
        type: 'CAPACITY_NEAR_FULL',
        severity: 'LOW',
        title: `Tank ${tank.tankNumber} Near Full Capacity (${((stock / capacity) * 100).toFixed(1)}%)`,
        explanation: `Tank contains ${stock.toFixed(2)} L out of ${capacity.toFixed(2)} L capacity. Additional bulk delivery may cause overflow.`,
        referenceId: tank.id,
        createdAt: new Date(),
      });
    }
  }

  // Rule 4: Delivery Discrepancies (Ordered != Received by > 100 L)
  const deliveries = await prisma.delivery.findMany({
    where: { stationId, status: 'CONFIRMED' },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { supplier: true, fuelProduct: true },
  });

  for (const del of deliveries) {
    const discrepancy = Math.abs(Number(del.discrepancyLiters || 0));
    if (discrepancy >= 100) {
      anomalies.push({
        type: 'DELIVERY_DISCREPANCY',
        severity: 'MEDIUM',
        title: `Delivery Volume Discrepancy (${discrepancy.toFixed(2)} L)`,
        explanation: `Invoice ${del.invoiceNumber} from ${del.supplier.name} had ordered ${Number(del.orderedQuantityLiters).toFixed(2)} L vs confirmed received ${Number(del.receivedQuantityLiters).toFixed(2)} L (${Number(del.discrepancyLiters).toFixed(2)} L net variance). Potential in-transit evaporation or transit shortfall.`,
        referenceId: del.id,
        createdAt: del.createdAt,
      });
    }
  }

  // Rule 5: Unclosed shifts running for more than 16 hours
  const openShifts = await prisma.shift.findMany({
    where: { stationId, status: 'OPEN' },
    include: { employee: true },
  });

  const now = new Date();
  for (const shift of openShifts) {
    const hoursElapsed = (now.getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 14) {
      anomalies.push({
        type: 'PROLONGED_OPEN_SHIFT',
        severity: 'MEDIUM',
        title: `Shift Overrun: ${shift.shiftName} (${hoursElapsed.toFixed(1)} hrs)`,
        explanation: `Shift assigned to ${shift.employee?.fullName || 'Attendant'} started on ${new Date(shift.startTime).toLocaleTimeString()} and has remained open for ${hoursElapsed.toFixed(1)} hours without day-end reconciliation.`,
        referenceId: shift.id,
        createdAt: shift.startTime,
      });
    }
  }

  return anomalies;
};
