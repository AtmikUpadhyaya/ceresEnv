import { Router } from 'express';
import { getCountySummary } from '../controllers/report.controller.js';
const router = Router();
router.get('/summary', getCountySummary);
export default router;
