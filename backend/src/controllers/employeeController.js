import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';

export const getEmployees = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const employees = await prisma.employee.findMany({
      where: stationId ? { stationId } : {},
      include: {
        user: { select: { email: true, role: true, active: true } },
        _count: { select: { shifts: true, sales: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    return successResponse(res, employees);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createEmployee = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    const { fullName, phone, role, salary, employeeCode } = req.body;

    const code = employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const employee = await prisma.employee.create({
      data: {
        stationId,
        fullName,
        phone,
        role: role || 'Attendant',
        employeeCode: code,
        salary: salary ? Number(salary) : null,
      },
    });

    return successResponse(res, employee, 'Employee successfully added.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
