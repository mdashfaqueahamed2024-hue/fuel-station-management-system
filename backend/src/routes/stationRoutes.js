import { Router } from 'express';
import { getAllStations, getStationById } from '../controllers/stationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getAllStations);
router.get('/:id', getStationById);

export default router;
