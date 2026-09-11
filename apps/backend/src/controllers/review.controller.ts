import { Response } from 'express';
import { reviewSchema } from '../validators/assessment.validator.js';
import { AuthenticatedRequest } from '../types/auth.js';
import * as service from '../services/review.service.js';
export async function reviewAssessment(
  req: AuthenticatedRequest,
  res: Response,
) {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: 'Invalid review data', issues: parsed.error.issues });
    return;
  }
  const input = parsed.data;
  const data = await service.reviewAssessment(
    String(req.params.id),
    input.reviewStatus,
    input.adminComment,
    req.user!.id,
  );
  if (!data) return res.status(404).json({ message: 'Assessment not found' });
  res.json({ data });
}
