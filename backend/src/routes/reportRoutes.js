import { Router } from 'express';
import { getDashboardData, getDailySalesReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', getDashboardData);
router.get('/daily-sales', getDailySalesReport);

export default router;
