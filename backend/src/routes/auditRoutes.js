import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('ADMIN', 'MANAGER'), getAuditLogs);

export default router;
