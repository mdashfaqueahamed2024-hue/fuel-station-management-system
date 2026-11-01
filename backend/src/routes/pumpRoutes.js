import { Router } from 'express';
import { getPumps, updatePumpStatus, recordManualMeterReading } from '../controllers/pumpController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getPumps);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), updatePumpStatus);
router.post('/meter-readings', recordManualMeterReading);

export default router;
