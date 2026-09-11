import { ReviewStatus } from '@fieldready/shared';
import * as repository from '../repositories/review.repository.js';
export async function reviewAssessment(
  id: string,
  status: ReviewStatus,
  comment: string,
  adminId: string,
) {
  return repository.reviewAssessment(id, status, comment, adminId);
}
