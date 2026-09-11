import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { AssessmentStatus } from '@fieldready/shared';
import { assessmentSchema } from '../validators/assessment.validator.js';
import * as service from '../services/assessment.service.js';
export async function getAssessments(_req: Request, res: Response) {
  res.json({ data: await service.listAssessments() });
}
export async function createAssessment(req: Request, res: Response) {
  try {
    const input = assessmentSchema.parse(req.body);
    const data = await service.saveAssessment({
      ...input,
      id: input.id || uuid(),
    });
    res.status(req.body.id ? 200 : 201).json({ data });
  } catch (error) {
    if (error instanceof service.LockedAssessmentError)
      return res.status(409).json({ message: error.message });
    if (error instanceof Error && error.name === 'ZodError')
      return res
        .status(400)
        .json({ message: 'Invalid assessment', issues: error });
    if (error instanceof service.ValidationError)
      return res.status(400).json({ errors: error.errors });
    throw error;
  }
}
export async function patchAssessmentStatus(req: Request, res: Response) {
  const data = await service.changeStatus(
    String(req.params.id),
    req.body.status as AssessmentStatus,
  );
  if (!data) return res.status(404).json({ message: 'Assessment not found' });
  res.json({ data });
}
export async function deleteAssessment(req: Request, res: Response) {
  const removed = await service.deleteAssessment(String(req.params.id));
  if (!removed)
    return res.status(404).json({ message: 'Assessment not found' });
  res.status(204).end();
}
