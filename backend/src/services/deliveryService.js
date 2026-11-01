import prisma from '../config/db.js';

export const createDelivery = async ({
  stationId,
  supplierId,
  destinationTankId,
  fuelProductId,
  deliveryReference,
  invoiceNumber,
  orderedQuantityLiters,
  receivedQuantityLiters,
  unitCost,
  receivingEmployeeId,
  notes,
  currentUser,
}) => {
  const discrepancy = Number(receivedQuantityLiters) - Number(orderedQuantityLiters);
  const totalCost = Number(receivedQuantityLiters) * Number(unitCost);

  const delivery = await prisma.delivery.create({
    data: {
      stationId,
      supplierId,
      destinationTankId,
      fuelProductId,
      deliveryReference,
      invoiceNumber,
      orderedQuantityLiters: Number(orderedQuantityLiters),
      receivedQuantityLiters: Number(receivedQuantityLiters),
      discrepancyLiters: discrepancy,
      unitCost: Number(unitCost),
      totalCost,
      receivingEmployeeId: receivingEmployeeId || null,
      status: 'PENDING', // Stock will NOT be updated until confirmed!
      notes,
    },
    include: {
      supplier: true,
      destinationTank: true,
      fuelProduct: true,
      receivingEmployee: true,
    },
  });

  return delivery;
};

export const confirmDelivery = async ({
  deliveryId,
  currentUser,
  ipAddress = null,
}) => {
  return await prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: { id: deliveryId },
      include: { destinationTank: true, fuelProduct: true, supplier: true },
    });

    if (!delivery) {
      throw new Error('Delivery record not found.');
    }

    if (delivery.status === 'CONFIRMED') {
      throw new Error('This delivery has already been confirmed and added to tank inventory.');
    }

    const currentStock = Number(delivery.destinationTank.currentStockLiters);
    const capacity = Number(delivery.destinationTank.capacityLiters);
    const received = Number(delivery.receivedQuantityLiters);
    const newStock = currentStock + received;

    // Check tank capacity overflow
    if (newStock > capacity) {
      await tx.alert.create({
        data: {
          stationId: delivery.stationId,
          alertType: 'HIGH_CAPACITY',
          severity: 'HIGH',
          title: `Tank ${delivery.destinationTank.tankNumber} Exceeds Nominal Capacity`,
          message: `Delivery confirmation of ${received.toFixed(2)} L brings tank volume to ${newStock.toFixed(2)} L against max rated capacity of ${capacity.toFixed(2)} L.`,
          status: 'ACTIVE',
        },
      });
    }

    // 1. Update Tank Inventory
    await tx.tank.update({
      where: { id: delivery.destinationTankId },
      data: { currentStockLiters: newStock },
    });

    // 2. Mark Delivery as CONFIRMED
    const confirmedDelivery = await tx.delivery.update({
      where: { id: deliveryId },
      data: { status: 'CONFIRMED' },
    });

    // 3. Record Stock Movement
    await tx.stockMovement.create({
      data: {
        stationId: delivery.stationId,
        tankId: delivery.destinationTankId,
        fuelProductId: delivery.fuelProductId,
        movementType: 'DELIVERY',
        quantityLiters: received,
        balanceAfterLiters: newStock,
        referenceId: delivery.id,
        referenceType: 'DELIVERY',
        notes: `Delivery ${delivery.deliveryReference} received from ${delivery.supplier.name} (Invoice: ${delivery.invoiceNumber})`,
      },
    });

    // 4. Log Audit
    await tx.auditLog.create({
      data: {
        stationId: delivery.stationId,
        userId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'DELIVERY_CONFIRM',
        entityType: 'Delivery',
        entityId: delivery.id,
        afterState: JSON.stringify({
          deliveryReference: delivery.deliveryReference,
          receivedLiters: received,
          newTankStock: newStock,
          totalCost: delivery.totalCost,
        }),
        ipAddress,
      },
    });

    return confirmedDelivery;
  });
};
