import { Router } from 'express';
import { getEmployees, createEmployee } from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getEmployees);
router.post('/', authorize('ADMIN', 'MANAGER'), createEmployee);

export default router;
