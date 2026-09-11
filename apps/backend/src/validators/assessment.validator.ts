import { z } from 'zod';
export const assessmentSchema = z.object({
  siteName: z.string().trim().min(2).max(160),
  address: z.string().trim().min(3).max(300),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  condition: z.enum(['Good', 'Moderate', 'Bad']),
  chickenCount: z.coerce.number().int().nonnegative(),
  photos: z.array(z.string()).max(5).default([]),
  notes: z.string().max(5000).default(''),
  assessor: z.string().max(120).default(''),
  access: z.enum(['Open', 'Limited', 'Blocked']).default('Open'),
  urgency: z
    .enum(['Routine', 'Follow-up needed', 'Immediate response'])
    .default('Routine'),
  structuralDamage: z.string().max(2000).default(''),
  poultryImpact: z.string().max(2000).default(''),
  status: z.enum(['draft', 'complete']).default('complete'),
  id: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
});
export const reviewSchema = z.object({
  reviewStatus: z.enum(['pending', 'approved', 'failed', 'flagged']),
  adminComment: z.string().trim().max(3000).default(''),
});
