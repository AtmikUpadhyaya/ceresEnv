import { Router } from 'express';
import { reviewAssessment } from '../controllers/review.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
const router = Router();
router.patch(
  '/:id/review',
  requireAuth,
  requireAdmin,
  asyncHandler(reviewAssessment),
);
export default router;
