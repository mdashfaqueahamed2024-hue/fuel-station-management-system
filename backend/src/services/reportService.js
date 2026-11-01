import prisma from '../config/db.js';

export const getDashboardSummary = async (stationId, timeframe = 'today') => {
  const now = new Date();
  let startDate = new Date();

  if (timeframe === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (timeframe === '7days') {
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  // 1. Sales metrics
  const sales = await prisma.sale.findMany({
    where: {
      stationId,
      paymentStatus: 'COMPLETED',
      createdAt: { gte: startDate },
    },
    include: { fuelProduct: true },
  });

  let totalRevenue = 0;
  let totalVolumeLiters = 0;
  let totalCostOfGoodsSold = 0;
  const fuelSalesMap = {};

  sales.forEach(s => {
    const rev = Number(s.totalAmount);
    const vol = Number(s.quantityLiters);
    const unitCost = Number(s.fuelProduct.costPrice || 0);
    const cost = vol * unitCost;

    totalRevenue += rev;
    totalVolumeLiters += vol;
    totalCostOfGoodsSold += cost;

    const fuelName = s.fuelProduct.name;
    if (!fuelSalesMap[fuelName]) {
      fuelSalesMap[fuelName] = { name: fuelName, liters: 0, revenue: 0, color: s.fuelProduct.colorCode };
    }
    fuelSalesMap[fuelName].liters += vol;
    fuelSalesMap[fuelName].revenue += rev;
  });

  const estimatedGrossMargin = totalRevenue - totalCostOfGoodsSold;
  const transactionCount = sales.length;

  // 2. Approved Expenses during this timeframe
  const expensesAggregate = await prisma.expense.aggregate({
    where: {
      stationId,
      approvalStatus: 'APPROVED',
      expenseDate: { gte: startDate },
    },
    _sum: { amount: true },
  });
  const totalExpenses = Number(expensesAggregate._sum.amount || 0);
  const estimatedNetProfit = estimatedGrossMargin - totalExpenses;

  // 3. Current Tank Stock Status
  const tanks = await prisma.tank.findMany({
    where: { stationId, active: true },
    include: { fuelProduct: true },
  });

  const tankSummaries = tanks.map(t => {
    const capacity = Number(t.capacityLiters);
    const stock = Number(t.currentStockLiters);
    const threshold = Number(t.lowStockThresholdLiters);
    const utilization = capacity > 0 ? (stock / capacity) * 100 : 0;
    const isLow = stock <= threshold;

    return {
      id: t.id,
      tankNumber: t.tankNumber,
      fuelName: t.fuelProduct.name,
      fuelType: t.fuelProduct.fuelType,
      colorCode: t.fuelProduct.colorCode,
      currentStockLiters: stock,
      capacityLiters: capacity,
      utilizationPercentage: Number(utilization.toFixed(1)),
      isLow,
    };
  });

  // 4. Recent Active Alerts
  const activeAlerts = await prisma.alert.findMany({
    where: { stationId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // 5. Active Shifts
  const activeShifts = await prisma.shift.findMany({
    where: { stationId, status: 'OPEN' },
    include: { employee: true },
  });

  // 6. Recent Deliveries
  const recentDeliveries = await prisma.delivery.findMany({
    where: { stationId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { supplier: true, fuelProduct: true, destinationTank: true },
  });

  // 7. Recent Sales Transactions
  const recentSales = await prisma.sale.findMany({
    where: { stationId },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: { fuelProduct: true, pump: true, attendant: true },
  });

  // 8. Daily Sales Trend (last 7 days grouped by date)
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const daySales = sales.filter(s => {
      const sDate = new Date(s.createdAt);
      return sDate >= dayStart && sDate <= dayEnd;
    });

    const dayRevenue = daySales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const dayVolume = daySales.reduce((acc, s) => acc + Number(s.quantityLiters), 0);

    past7Days.push({
      date: dayStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: Math.round(dayRevenue),
      liters: Math.round(dayVolume),
    });
  }

  return {
    timeframe,
    kpis: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalVolumeLiters: Number(totalVolumeLiters.toFixed(2)),
      transactionCount,
      costOfGoodsSold: Number(totalCostOfGoodsSold.toFixed(2)),
      estimatedGrossMargin: Number(estimatedGrossMargin.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      estimatedNetProfit: Number(estimatedNetProfit.toFixed(2)),
    },
    tankSummaries,
    fuelDistribution: Object.values(fuelSalesMap),
    salesTrend: past7Days,
    recentSales,
    recentDeliveries,
    activeShifts,
    activeAlerts,
  };
};
