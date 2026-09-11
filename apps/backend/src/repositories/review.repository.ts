import { Assessment, ReviewStatus } from '@fieldready/shared';
import { pool } from '../db/pool.js';

export async function reviewAssessment(
  id: string,
  status: ReviewStatus,
  comment: string,
  adminId: string,
): Promise<Assessment | null> {
  const result = await pool.query(
    `UPDATE assessments SET review_status=$1,admin_comment=$2,reviewed_by=$3,reviewed_at=NOW(),updated_at=NOW() WHERE id=$4 RETURNING id,site_name,address,latitude,longitude,condition,chicken_count,photos,notes,assessor,access,urgency,structural_damage,poultry_impact,status,created_at,updated_at,review_status,admin_comment,reviewed_by,reviewed_at`,
    [status, comment, adminId, id],
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    siteName: row.site_name,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    condition: row.condition,
    chickenCount: Number(row.chicken_count),
    photos: row.photos || [],
    notes: row.notes,
    assessor: row.assessor,
    access: row.access,
    urgency: row.urgency,
    structuralDamage: row.structural_damage,
    poultryImpact: row.poultry_impact,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    reviewStatus: row.review_status,
    adminComment: row.admin_comment,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at?.toISOString(),
  };
}
