import { Response } from 'express';
import { getSummary } from '../services/report.service.js';
import { AuthenticatedRequest } from '../types/auth.js';
export async function getCountySummary(
  req: AuthenticatedRequest,
  res: Response,
) {
  res.json({
    data: await getSummary(req.user!.id, req.user!.role === 'admin'),
  });
}
