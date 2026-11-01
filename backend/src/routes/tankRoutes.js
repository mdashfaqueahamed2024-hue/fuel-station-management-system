import { Router } from 'express';
import { getTanks, adjustStock, getStockMovements } from '../controllers/tankController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { adjustStockSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getTanks);
router.post('/adjust', authorize('ADMIN', 'MANAGER'), validateBody(adjustStockSchema), adjustStock);
router.get('/movements', getStockMovements);

export default router;
