import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const getExpenses = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const { categoryId, status, startDate, endDate } = req.query;

    const where = {};
    if (stationId) where.stationId = stationId;
    if (categoryId) where.categoryId = categoryId;
    if (status) where.approvalStatus = status;

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: {
        category: true,
        recordedBy: { select: { fullName: true, email: true } },
        approvedBy: { select: { fullName: true } },
      },
    });

    return successResponse(res, expenses);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getExpenseCategories = async (req, res) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return successResponse(res, categories);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createExpense = async (req, res) => {
  try {
    const stationId = resolveStation(req) || req.body.stationId;
    const { categoryId, description, amount, receiptRef } = req.body;

    const expense = await prisma.expense.create({
      data: {
        stationId,
        categoryId,
        description,
        amount: Number(amount),
        recordedByUserId: req.user.id,
        approvalStatus: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        approvedByUserId: req.user.role === 'ADMIN' ? req.user.id : null,
        receiptRef,
      },
      include: { category: true, recordedBy: true },
    });

    return successResponse(res, expense, 'Expense successfully submitted.', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const reviewExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        approvalStatus: status,
        approvedByUserId: req.user.id,
      },
      include: { category: true },
    });

    await logAudit({
      stationId: updated.stationId,
      userId: req.user.id,
      actorName: req.user.fullName,
      action: 'EXPENSE_REVIEW',
      entityType: 'Expense',
      entityId: id,
      afterState: { status, amount: updated.amount },
      ipAddress: req.ip,
    });

    return successResponse(res, updated, `Expense ${status.toLowerCase()} successfully.`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
