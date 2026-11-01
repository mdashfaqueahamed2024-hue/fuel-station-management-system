import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { createDelivery, confirmDelivery } from '../services/deliveryService.js';
import { convertToCSV } from '../utils/csvExporter.js';

export const getDeliveries = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const deliveries = await prisma.delivery.findMany({
      where: stationId ? { stationId } : {},
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        destinationTank: true,
        fuelProduct: true,
        receivingEmployee: true,
      },
    });

    return successResponse(res, deliveries);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createNewDelivery = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    if (!stationId) {
      return errorResponse(res, 'Station ID required.', 400);
    }

    const delivery = await createDelivery({
      ...req.body,
      stationId,
      currentUser: req.user,
    });

    return successResponse(
      res,
      delivery,
      'Delivery recorded in PENDING status. Note: Inventory is not updated until confirmed.',
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const confirmDeliveryReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const confirmed = await confirmDelivery({
      deliveryId: id,
      currentUser: req.user,
      ipAddress: req.ip,
    });

    return successResponse(
      res,
      confirmed,
      'Delivery confirmed successfully! Tank inventory and stock movement updated.'
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const exportDeliveriesCSV = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const deliveries = await prisma.delivery.findMany({
      where: stationId ? { stationId } : {},
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, fuelProduct: true, destinationTank: true },
    });

    const fields = [
      { key: 'deliveryReference', label: 'Reference' },
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'supplier', label: 'Supplier', getter: d => d.supplier.name },
      { key: 'fuel', label: 'Fuel Product', getter: d => d.fuelProduct.name },
      { key: 'tank', label: 'Destination Tank', getter: d => d.destinationTank.tankNumber },
      { key: 'orderedQuantityLiters', label: 'Ordered (L)' },
      { key: 'receivedQuantityLiters', label: 'Received (L)' },
      { key: 'discrepancyLiters', label: 'Discrepancy (L)' },
      { key: 'unitCost', label: 'Cost/L (₹)' },
      { key: 'totalCost', label: 'Total Cost (₹)' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date', getter: d => new Date(d.createdAt).toLocaleDateString('en-IN') },
    ];

    const csvData = convertToCSV(deliveries, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="deliveries-export.csv"');
    return res.status(200).send(csvData);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
