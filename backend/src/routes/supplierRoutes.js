import { Router } from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplierController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createSupplierSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getSuppliers);
router.post('/', authorize('ADMIN', 'MANAGER'), validateBody(createSupplierSchema), createSupplier);

export default router;
