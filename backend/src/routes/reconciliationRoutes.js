import { Router } from 'express';
import { getReconciliations, executeReconciliation } from '../controllers/reconciliationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createReconciliationSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getReconciliations);
router.post('/', authorize('ADMIN', 'MANAGER'), validateBody(createReconciliationSchema), executeReconciliation);

export default router;
