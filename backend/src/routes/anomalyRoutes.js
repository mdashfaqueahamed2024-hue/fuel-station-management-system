import { Router } from 'express';
import { getStationAnomalies, getAlerts, resolveAlert } from '../controllers/anomalyController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/anomalies', getStationAnomalies);
router.get('/alerts', getAlerts);
router.patch('/alerts/:id/resolve', authorize('ADMIN', 'MANAGER'), resolveAlert);

export default router;
