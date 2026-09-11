import {
  Assessment,
  AssessmentStatus,
  CreateAssessmentInput,
  validateAssessment,
} from '@fieldready/shared';
import * as repository from '../repositories/assessment.repository.js';
export class ValidationError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    super('Assessment validation failed');
  }
}
export class LockedAssessmentError extends Error {}
export async function listAssessments(userId: string, isAdmin: boolean) {
  return repository.findAll(isAdmin ? undefined : userId);
}
export async function saveAssessment(
  input: CreateAssessmentInput,
  userId: string,
): Promise<Assessment> {
  const errors = validateAssessment(input);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  if (input.id) {
    const reviewStatus = await repository.findReviewStatus(input.id);
    if (reviewStatus && reviewStatus !== 'pending')
      throw new LockedAssessmentError('Reviewed assessments cannot be edited');
  }
  const assessment = await repository.createOrUpdate(input, userId);
  if (!assessment)
    throw new LockedAssessmentError('Assessment belongs to another user');
  return assessment;
}
export async function changeStatus(
  id: string,
  status: AssessmentStatus,
  userId: string,
  isAdmin: boolean,
): Promise<Assessment | null> {
  return repository.updateStatus(id, status, isAdmin ? undefined : userId);
}
export async function deleteAssessment(
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  return repository.remove(id, isAdmin ? undefined : userId);
}
