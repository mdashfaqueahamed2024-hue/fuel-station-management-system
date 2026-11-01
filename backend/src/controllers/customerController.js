import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';

export const getCustomers = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { search } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(res, customers);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    const { name, phone, email, companyName, customerType, creditLimit } = req.body;

    const customer = await prisma.customer.create({
      data: {
        stationId,
        name,
        phone,
        email,
        companyName,
        customerType: customerType || 'INDIVIDUAL',
        creditLimit: creditLimit ? Number(creditLimit) : 0,
      },
    });

    return successResponse(res, customer, 'Customer record created.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
