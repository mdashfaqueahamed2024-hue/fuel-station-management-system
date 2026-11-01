import { Router } from 'express';
import {
  getExpenses,
  getExpenseCategories,
  createExpense,
  reviewExpense,
} from '../controllers/expenseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createExpenseSchema, approveExpenseSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getExpenses);
router.get('/categories', getExpenseCategories);
router.post('/', validateBody(createExpenseSchema), createExpense);
router.patch('/:id/review', authorize('ADMIN', 'MANAGER'), validateBody(approveExpenseSchema), reviewExpense);

export default router;
