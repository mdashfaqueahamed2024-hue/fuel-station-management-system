import { Router } from 'express';
import { getFuelProducts, updateFuelPrice } from '../controllers/fuelController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateFuelPriceSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getFuelProducts);
router.patch('/:id/price', authorize('ADMIN', 'MANAGER'), validateBody(updateFuelPriceSchema), updateFuelPrice);

export default router;
