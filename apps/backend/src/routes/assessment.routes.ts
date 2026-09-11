import { Router } from 'express';
import {
  createAssessment,
  deleteAssessment,
  getAssessments,
  patchAssessmentStatus,
} from '../controllers/assessment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.use(requireAuth);
router.get('/', getAssessments);
router.post('/', createAssessment);
router.patch('/:id/status', patchAssessmentStatus);
router.delete('/:id', deleteAssessment);
export default router;
