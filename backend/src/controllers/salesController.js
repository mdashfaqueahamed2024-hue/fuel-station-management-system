import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { processSale, reverseSale } from '../services/salesService.js';
import { convertToCSV } from '../utils/csvExporter.js';

export const getSales = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const {
      search,
      fuelProductId,
      paymentMethod,
      startDate,
      endDate,
      limit = 50,
      page = 1,
    } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search } },
        { attendant: { fullName: { contains: search } } },
        { customer: { name: { contains: search } } },
      ];
    }

    if (fuelProductId) where.fuelProductId = fuelProductId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          fuelProduct: true,
          pump: true,
          tank: true,
          attendant: true,
          customer: true,
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return successResponse(res, {
      sales,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createNewSale = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    if (!stationId) {
      return errorResponse(res, 'Station identifier is required.', 400);
    }

    const sale = await processSale({
      ...req.body,
      stationId,
      currentUser: req.user,
      ipAddress: req.ip,
    });

    return successResponse(res, sale, 'Sale transaction successfully executed.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const reverseSaleTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reversed = await reverseSale({
      saleId: id,
      reason,
      currentUser: req.user,
      ipAddress: req.ip,
    });

    return successResponse(
      res,
      reversed,
      `Sale ${reversed.transactionNumber} was successfully reversed and inventory restored.`
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const exportSalesCSV = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const sales = await prisma.sale.findMany({
      where: stationId ? { stationId } : {},
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        fuelProduct: true,
        pump: true,
        attendant: true,
        customer: true,
      },
    });

    const fields = [
      { key: 'transactionNumber', label: 'Transaction #' },
      { key: 'createdAt', label: 'Date Time', getter: s => new Date(s.createdAt).toLocaleString('en-IN') },
      { key: 'fuel', label: 'Fuel Product', getter: s => s.fuelProduct.name },
      { key: 'pumpNumber', label: 'Pump', getter: s => s.pump.pumpNumber },
      { key: 'attendant', label: 'Attendant', getter: s => s.attendant?.fullName || 'N/A' },
      { key: 'quantityLiters', label: 'Volume (L)', getter: s => Number(s.quantityLiters).toFixed(2) },
      { key: 'pricePerLiter', label: 'Price/L (₹)', getter: s => Number(s.pricePerLiter).toFixed(2) },
      { key: 'discountAmount', label: 'Discount (₹)', getter: s => Number(s.discountAmount).toFixed(2) },
      { key: 'totalAmount', label: 'Total (₹)', getter: s => Number(s.totalAmount).toFixed(2) },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentStatus', label: 'Status' },
      { key: 'customer', label: 'Customer', getter: s => s.customer?.name || 'Walk-in' },
    ];

    const csvData = convertToCSV(sales, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-export.csv"');
    return res.status(200).send(csvData);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
