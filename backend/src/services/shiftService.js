import prisma from '../config/db.js';

export const openShift = async ({
  stationId,
  employeeId,
  shiftName,
  openingCash = 0,
  pumps = [], // [{ pumpId, openingReading }]
  currentUser,
}) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if employee already has an active open shift
    const existingOpenShift = await tx.shift.findFirst({
      where: {
        stationId,
        employeeId,
        status: 'OPEN',
      },
    });

    if (existingOpenShift) {
      throw new Error('This employee already has an open active shift in progress.');
    }

    // 2. Create the shift
    const shift = await tx.shift.create({
      data: {
        stationId,
        employeeId,
        shiftName,
        status: 'OPEN',
        openingCash: Number(openingCash),
        expectedCash: Number(openingCash),
        actualCash: 0,
        cashVariance: 0,
      },
    });

    // 3. Record opening meter readings for pumps
    if (pumps.length > 0) {
      for (const p of pumps) {
        await tx.shiftMeter.create({
          data: {
            shiftId: shift.id,
            pumpId: p.pumpId,
            openingReading: Number(p.openingReading),
          },
        });

        // Also record in central MeterReading table
        await tx.meterReading.create({
          data: {
            stationId,
            pumpId: p.pumpId,
            shiftId: shift.id,
            readingType: 'OPENING',
            readingValue: Number(p.openingReading),
            recordedByUserId: currentUser.id,
            notes: `Shift ${shift.shiftName} opening reading`,
          },
        });
      }
    }

    // 4. Log audit
    await tx.auditLog.create({
      data: {
        stationId,
        userId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'SHIFT_OPEN',
        entityType: 'Shift',
        entityId: shift.id,
        afterState: JSON.stringify({ shiftName, openingCash }),
      },
    });

    return shift;
  });
};

export const closeShift = async ({
  shiftId,
  actualCash,
  closingNotes = '',
  pumps = [], // [{ pumpId, closingReading }]
  currentUser,
}) => {
  return await prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: { id: shiftId },
      include: { employee: true, shiftMeters: true },
    });

    if (!shift) {
      throw new Error('Shift record not found.');
    }

    if (shift.status === 'CLOSED') {
      throw new Error('This shift is already closed.');
    }

    // 1. Calculate total CASH sales made during this shift
    const cashSalesAggregate = await tx.sale.aggregate({
      where: {
        shiftId: shift.id,
        paymentMethod: 'CASH',
        paymentStatus: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalCashSales = Number(cashSalesAggregate._sum.totalAmount || 0);
    const openingCash = Number(shift.openingCash || 0);
    const expectedCash = openingCash + totalCashSales;
    const actualCashCollected = Number(actualCash);
    const cashVariance = actualCashCollected - expectedCash; // positive = surplus, negative = deficit

    // 2. Process closing pump meter readings and check for discrepancies
    if (pumps.length > 0) {
      for (const p of pumps) {
        const shiftMeter = await tx.shiftMeter.findFirst({
          where: {
            shiftId: shift.id,
            pumpId: p.pumpId,
          },
        });

        const closingVal = Number(p.closingReading);
        const openingVal = shiftMeter ? Number(shiftMeter.openingReading) : 0;
        const volumeSold = Math.max(0, closingVal - openingVal);

        if (shiftMeter) {
          await tx.shiftMeter.update({
            where: { id: shiftMeter.id },
            data: {
              closingReading: closingVal,
              volumeSold,
            },
          });
        }

        // Record in central MeterReading
        await tx.meterReading.create({
          data: {
            stationId: shift.stationId,
            pumpId: p.pumpId,
            shiftId: shift.id,
            readingType: 'CLOSING',
            readingValue: closingVal,
            differenceLiters: volumeSold,
            recordedByUserId: currentUser.id,
            notes: `Shift ${shift.shiftName} closing reading`,
          },
        });

        // Compare meter volume sold with actual sales transactions volume on this pump
        const salesVolumeAggregate = await tx.sale.aggregate({
          where: {
            shiftId: shift.id,
            pumpId: p.pumpId,
            paymentStatus: 'COMPLETED',
          },
          _sum: {
            quantityLiters: true,
          },
        });

        const recordedSalesVol = Number(salesVolumeAggregate._sum.quantityLiters || 0);
        const meterDiff = Math.abs(volumeSold - recordedSalesVol);

        // Discrepancy > 10 Liters triggers alert
        if (meterDiff > 10) {
          await tx.alert.create({
            data: {
              stationId: shift.stationId,
              alertType: 'METER_DISCREPANCY',
              severity: 'HIGH',
              title: `Meter vs POS Discrepancy on Pump (${meterDiff.toFixed(2)} L)`,
              message: `Pump closing difference registered ${volumeSold.toFixed(2)} L but POS logged ${recordedSalesVol.toFixed(2)} L during shift ${shift.shiftName}.`,
              status: 'ACTIVE',
            },
          });
        }
      }
    }

    // 3. Trigger alert if cash variance is significant (|variance| >= 500)
    if (Math.abs(cashVariance) >= 500) {
      await tx.alert.create({
        data: {
          stationId: shift.stationId,
          alertType: 'CASH_VARIANCE',
          severity: Math.abs(cashVariance) > 2000 ? 'CRITICAL' : 'HIGH',
          title: `Cash Reconciliation Variance: ₹${cashVariance.toFixed(2)}`,
          message: `Shift closed with Expected Cash: ₹${expectedCash.toFixed(2)}, Actual Cash: ₹${actualCashCollected.toFixed(2)} (${cashVariance < 0 ? 'Shortfall' : 'Excess'} of ₹${Math.abs(cashVariance).toFixed(2)}).`,
          status: 'ACTIVE',
        },
      });
    }

    // 4. Update and close shift
    const closedShift = await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        expectedCash,
        actualCash: actualCashCollected,
        cashVariance,
        closingNotes,
      },
      include: {
        employee: true,
        shiftMeters: { include: { pump: true } },
      },
    });

    // 5. Log audit
    await tx.auditLog.create({
      data: {
        stationId: shift.stationId,
        userId: currentUser.id,
        actorName: currentUser.fullName,
        action: 'SHIFT_CLOSE',
        entityType: 'Shift',
        entityId: shift.id,
        afterState: JSON.stringify({ expectedCash, actualCashCollected, cashVariance }),
      },
    });

    return closedShift;
  });
};
