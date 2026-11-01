import { Router } from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCustomerSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getCustomers);
router.post('/', validateBody(createCustomerSchema), createCustomer);

export default router;
