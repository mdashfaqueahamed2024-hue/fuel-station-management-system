import { describe, it, expect } from 'vitest';

describe('Stock Reconciliation Mathematical Model', () => {
  it('correctly calculates expected closing stock with deliveries, sales, and adjustments', () => {
    const openingStock = 15000.0;
    const confirmedDeliveries = 10000.0;
    const recordedSales = 8500.0;
    const positiveAdjustments = 100.0;
    const negativeAdjustments = -50.0;
    const netAdjustments = positiveAdjustments + negativeAdjustments;

    // Expected Closing Stock = Opening Stock + Confirmed Received Quantity - Recorded Sold Quantity + Authorized Adjustments
    const expectedClosingStock = openingStock + confirmedDeliveries - recordedSales + netAdjustments;

    expect(expectedClosingStock).toBe(16550.0);

    const physicalMeasuredStock = 16530.0;
    const varianceLiters = physicalMeasuredStock - expectedClosingStock;
    const variancePercentage = (varianceLiters / expectedClosingStock) * 100;

    expect(varianceLiters).toBe(-20.0);
    expect(Number(variancePercentage.toFixed(2))).toBe(-0.12);
  });
});
