import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { getDashboardSummary } from '../services/reportService.js';
import prisma from '../config/db.js';

export const getDashboardData = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { timeframe } = req.query; // today, 7days, month

    if (!stationId) {
      // If admin and no station selected, pick first active station
      const firstStation = await prisma.station.findFirst();
      if (!firstStation) return errorResponse(res, 'No stations configured in system.', 404);
      const data = await getDashboardSummary(firstStation.id, timeframe);
      return successResponse(res, data);
    }

    const data = await getDashboardSummary(stationId, timeframe);
    return successResponse(res, data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getDailySalesReport = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: {
        stationId: stationId ? stationId : undefined,
        createdAt: { gte: dayStart, lte: dayEnd },
        paymentStatus: 'COMPLETED',
      },
      include: {
        fuelProduct: true,
        pump: true,
        attendant: true,
      },
    });

    const summaryByFuel = {};
    let totalRevenue = 0;
    let totalLiters = 0;

    sales.forEach(s => {
      const fuel = s.fuelProduct.name;
      if (!summaryByFuel[fuel]) {
        summaryByFuel[fuel] = { fuel, liters: 0, revenue: 0, count: 0 };
      }
      summaryByFuel[fuel].liters += Number(s.quantityLiters);
      summaryByFuel[fuel].revenue += Number(s.totalAmount);
      summaryByFuel[fuel].count += 1;

      totalRevenue += Number(s.totalAmount);
      totalLiters += Number(s.quantityLiters);
    });

    return successResponse(res, {
      date: dayStart.toISOString().slice(0, 10),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalLiters: Number(totalLiters.toFixed(2)),
      totalTransactions: sales.length,
      breakdownByFuel: Object.values(summaryByFuel),
      salesList: sales,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
