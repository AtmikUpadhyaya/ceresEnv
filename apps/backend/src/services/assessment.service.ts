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
export async function listAssessments(): Promise<Assessment[]> {
  return repository.findAll();
}
export async function saveAssessment(
  input: CreateAssessmentInput,
): Promise<Assessment> {
  const errors = validateAssessment(input);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  if (input.id) {
    const reviewStatus = await repository.findReviewStatus(input.id);
    if (reviewStatus && reviewStatus !== 'pending')
      throw new LockedAssessmentError('Reviewed assessments cannot be edited');
  }
  return repository.createOrUpdate(input);
}
export async function changeStatus(
  id: string,
  status: AssessmentStatus,
): Promise<Assessment | null> {
  return repository.updateStatus(id, status);
}
export async function deleteAssessment(id: string): Promise<boolean> {
  return repository.remove(id);
}
