import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, suppliers);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, taxId } = req.body;
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
        taxId,
      },
    });

    return successResponse(res, supplier, 'Supplier added successfully.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
