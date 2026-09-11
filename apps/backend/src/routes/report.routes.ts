import { Router } from 'express';
import { getCountySummary } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
const router = Router();
router.use(requireAuth);
router.get('/summary', asyncHandler(getCountySummary));
export default router;
