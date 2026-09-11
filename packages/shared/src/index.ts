export const CONDITIONS = ['Good', 'Moderate', 'Bad'] as const;
export const ACCESS_OPTIONS = ['Open', 'Limited', 'Blocked'] as const;
export const URGENCY_OPTIONS = [
  'Routine',
  'Follow-up needed',
  'Immediate response',
] as const;

export type Condition = (typeof CONDITIONS)[number];
export type AccessStatus = (typeof ACCESS_OPTIONS)[number];
export type Urgency = (typeof URGENCY_OPTIONS)[number];
export type AssessmentStatus = 'draft' | 'complete';
export type ReviewStatus = 'pending' | 'approved' | 'failed' | 'flagged';

export interface Assessment {
  id: string;
  siteName: string;
  address: string;
  latitude: number;
  longitude: number;
  condition: Condition;
  chickenCount: number;
  photos: string[];
  notes: string;
  assessor: string;
  access: AccessStatus;
  urgency: Urgency;
  structuralDamage: string;
  poultryImpact: string;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  reviewStatus: ReviewStatus;
  adminComment: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type CreateAssessmentInput = Omit<
  Assessment,
  | 'createdAt'
  | 'updatedAt'
  | 'reviewStatus'
  | 'adminComment'
  | 'reviewedBy'
  | 'reviewedAt'
> & {
  createdAt?: string;
};

export interface AssessmentSummary {
  totalSites: number;
  completeSites: number;
  draftSites: number;
  totalChickens: number;
  urgentSites: number;
  byCondition: Record<Condition, number>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'assessor' | 'admin';
}

export function validateAssessment(
  input: Partial<CreateAssessmentInput>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of [
    'siteName',
    'address',
    'latitude',
    'longitude',
    'condition',
    'chickenCount',
  ]) {
    if (
      input[field as keyof CreateAssessmentInput] === undefined ||
      input[field as keyof CreateAssessmentInput] === ''
    )
      errors[field] = 'Required';
  }
  if (input.condition && !CONDITIONS.includes(input.condition as Condition))
    errors.condition = 'Invalid condition';
  if (input.access && !ACCESS_OPTIONS.includes(input.access as AccessStatus))
    errors.access = 'Invalid access value';
  if (input.urgency && !URGENCY_OPTIONS.includes(input.urgency as Urgency))
    errors.urgency = 'Invalid urgency';
  if (input.latitude !== undefined && Number.isNaN(Number(input.latitude)))
    errors.latitude = 'Must be a number';
  if (input.longitude !== undefined && Number.isNaN(Number(input.longitude)))
    errors.longitude = 'Must be a number';
  if (input.chickenCount !== undefined && Number(input.chickenCount) < 0)
    errors.chickenCount = 'Cannot be negative';
  return errors;
}
