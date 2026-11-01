import { Router } from 'express';
import { getShifts, startShift, endShift } from '../controllers/shiftController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { openShiftSchema, closeShiftSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', getShifts);
router.post('/open', validateBody(openShiftSchema), startShift);
router.post('/:id/close', validateBody(closeShiftSchema), endShift);

export default router;
