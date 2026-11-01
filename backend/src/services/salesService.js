import prisma from '../config/db.js';
import { logAudit } from './auditService.js';

export const processSale = async ({
  stationId,
  pumpId,
  fuelProductId,
  tankId,
  attendantId,
  customerId = null,
  shiftId = null,
  quantityLiters,
  pricePerLiter,
  discountAmount = 0,
  taxAmount = 0,
  paymentMethod = 'CASH',
  currentUser,
  ipAddress = null,
}) => {
  // Execute everything within an ACID transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch and lock tank row for stock check
    const tank = await tx.tank.findUnique({
      where: { id: tankId },
      include: { fuelProduct: true },
    });

    if (!tank || !tank.active) {
      throw new Error('Designated tank is invalid or deactivated.');
    }

    const currentStock = Number(tank.currentStockLiters);
    const requestedQty = Number(quantityLiters);

    // 2. Prevent stock from dropping below zero
    if (currentStock < requestedQty) {
      throw new Error(
        `Insufficient fuel in ${tank.tankNumber}. Available: ${currentStock.toFixed(2)} L, requested: ${requestedQty.toFixed(2)} L.`
      );
    }

    // 3. Verify pump exists and belongs to tank
    const pump = await tx.pump.findUnique({
      where: { id: pumpId },
    });

    if (!pump || pump.tankId !== tankId) {
      throw new Error('Pump is not connected to the selected fuel tank.');
    }

    // 4. Calculate authoritative monetary figures
    const subtotal = requestedQty * Number(pricePerLiter);
    const calculatedTotal = Math.max(0, subtotal - Number(discountAmount) + Number(taxAmount));

    // Generate unique transaction number: TXN-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const transactionNumber = `TXN-${dateStr}-${randomHex}`;

    // 5. Decrement Tank Stock
    const newStock = currentStock - requestedQty;
    const updatedTank = await tx.tank.update({
      where: { id: tankId },
      data: { currentStockLiters: newStock },
    });

    // 6. Increment Pump Lifetime Output
    await tx.pump.update({
      where: { id: pumpId },
      data: {
        totalLifetimeLiters: Number(pump.totalLifetimeLiters || 0) + requestedQty,
      },
    });

    // 7. Create Sale Record
    const sale = await tx.sale.create({
      data: {
        stationId,
        transactionNumber,
        pumpId,
        fuelProductId,
        tankId,
        attendantId,
        customerId: customerId || null,
        shiftId: shiftId || null,
        quantityLiters: requestedQty,
        pricePerLiter: Number(pricePerLiter),
        discountAmount: Number(discountAmount),
        taxAmount: Number(taxAmount),
        totalAmount: calculatedTotal,
        paymentMethod,
        paymentStatus: 'COMPLETED',
      },
      include: {
        fuelProduct: true,
        pump: true,
        tank: true,
        attendant: true,
        customer: true,
      },
    });

    // 8. Record Stock Movement
    await tx.stockMovement.create({
      data: {
        stationId,
        tankId,
        fuelProductId,
        movementType: 'SALE',
        quantityLiters: -requestedQty,
        balanceAfterLiters: newStock,
        referenceId: sale.id,
        referenceType: 'SALE',
        notes: `Dispensed at Pump ${pump.pumpNumber} via ${transactionNumber}`,
      },
    });

    // 9. If stock dips below threshold, create Alert
    if (newStock <= Number(tank.lowStockThresholdLiters)) {
      await tx.alert.create({
        data: {
          stationId,
          alertType: 'LOW_STOCK',
          severity: 'HIGH',
          title: `Low Stock Alert: ${tank.tankNumber}`,
          message: `${tank.fuelProduct.name} stock in ${tank.tankNumber} has reached ${newStock.toFixed(2)} L (Threshold: ${tank.lowStockThresholdLiters} L).`,
          status: 'ACTIVE',
        },
      });
    }

    // 10. Audit Record
    await tx.auditLog.create({
      data: {
        stationId,
        userId: currentUser?.id,
        actorName: currentUser?.fullName || 'Attendant',
        action: 'SALE_CREATE',
        entityType: 'Sale',
        entityId: sale.id,
        afterState: JSON.stringify({
          transactionNumber,
          fuel: tank.fuelProduct.name,
          quantityLiters: requestedQty,
          totalAmount: calculatedTotal,
          paymentMethod,
        }),
        ipAddress,
      },
    });

    return sale;
  });
};

export const reverseSale = async ({
  saleId,
  reason,
  currentUser,
  ipAddress = null,
}) => {
  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { tank: true, fuelProduct: true },
    });

    if (!sale) {
      throw new Error('Sale transaction not found.');
    }

    if (sale.paymentStatus === 'REVERSED') {
      throw new Error('This sale transaction has already been reversed.');
    }

    const restoreQty = Number(sale.quantityLiters);
    const newStock = Number(sale.tank.currentStockLiters) + restoreQty;

    // 1. Update Tank Stock (restore inventory)
    await tx.tank.update({
      where: { id: sale.tankId },
      data: { currentStockLiters: newStock },
    });

    // 2. Mark Sale as REVERSED (preserve financial history)
    const reversedSale = await tx.sale.update({
      where: { id: saleId },
      data: {
        paymentStatus: 'REVERSED',
        reversalReason: reason,
        reversedAt: new Date(),
        reversedByUserId: currentUser.id,
      },
    });

    // 3. Record Stock Movement
    await tx.stockMovement.create({
      data: {
        stationId: sale.stationId,
        tankId: sale.tankId,
        fuelProductId: sale.fuelProductId,
        movementType: 'REVERSAL',
        quantityLiters: restoreQty,
        balanceAfterLiters: newStock,
        referenceId: sale.id,
        referenceType: 'SALE_REVERSAL',
        notes: `Sale ${sale.transactionNumber} reversed. Reason: ${reason}`,
      },
    });

    // 4. Log Audit
    await tx.auditLog.create({
      data: {
        stationId: sale.stationId,
        userId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'SALE_REVERSE',
        entityType: 'Sale',
        entityId: sale.id,
        beforeState: JSON.stringify({ paymentStatus: 'COMPLETED', totalAmount: sale.totalAmount }),
        afterState: JSON.stringify({ paymentStatus: 'REVERSED', reason, restoredQty: restoreQty }),
        ipAddress,
      },
    });

    return reversedSale;
  });
};
