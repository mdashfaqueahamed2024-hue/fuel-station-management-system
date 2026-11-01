import { Router } from 'express';
import { getSales, createNewSale, reverseSaleTransaction, exportSalesCSV } from '../controllers/salesController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createSaleSchema, reverseSaleSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getSales);
router.get('/export/csv', exportSalesCSV);
router.post('/', validateBody(createSaleSchema), createNewSale);
router.post('/:id/reverse', authorize('ADMIN', 'MANAGER'), validateBody(reverseSaleSchema), reverseSaleTransaction);

export default router;
