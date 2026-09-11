import { Router } from 'express';
import { reviewAssessment } from '../controllers/review.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.patch('/:id/review', requireAuth, requireAdmin, reviewAssessment);
export default router;
