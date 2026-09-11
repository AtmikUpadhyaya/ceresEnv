import {
  Assessment,
  AssessmentSummary,
  CreateAssessmentInput,
} from '@fieldready/shared';
import { getToken } from './auth';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4100/api';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, ...options?.headers },
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
export const listAssessments = () =>
  request<{ data: Assessment[] }>('/assessments');
export const getSummary = () =>
  request<{ data: AssessmentSummary }>('/reports/summary');
export const saveAssessment = (record: CreateAssessmentInput) =>
  request<{ data: Assessment }>('/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
export const deleteAssessment = (id: string) =>
  fetch(`${API}/assessments/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
export const reviewAssessment = (
  id: string,
  reviewStatus: string,
  adminComment: string,
) =>
  request<{ data: Assessment }>(`/reviews/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewStatus, adminComment }),
  });
