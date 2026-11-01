import { Router } from 'express';
import { login, logout, getProfile, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '../validators/schemas.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export default router;
