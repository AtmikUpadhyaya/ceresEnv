import { Router } from 'express';
import {
  createAssessment,
  deleteAssessment,
  getAssessments,
  patchAssessmentStatus,
} from '../controllers/assessment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getAssessments));
router.post('/', asyncHandler(createAssessment));
router.patch('/:id/status', asyncHandler(patchAssessmentStatus));
router.delete('/:id', asyncHandler(deleteAssessment));
export default router;
