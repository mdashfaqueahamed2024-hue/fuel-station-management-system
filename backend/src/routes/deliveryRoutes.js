import { Router } from 'express';
import {
  getDeliveries,
  createNewDelivery,
  confirmDeliveryReceipt,
  exportDeliveriesCSV,
} from '../controllers/deliveryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createDeliverySchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getDeliveries);
router.get('/export/csv', exportDeliveriesCSV);
router.post('/', authorize('ADMIN', 'MANAGER'), validateBody(createDeliverySchema), createNewDelivery);
router.post('/:id/confirm', authorize('ADMIN', 'MANAGER'), confirmDeliveryReceipt);

export default router;
