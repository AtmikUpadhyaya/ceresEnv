import {
  Assessment,
  CreateAssessmentInput,
  AssessmentStatus,
} from '@fieldready/shared';
import { pool } from '../db/pool.js';

type AssessmentRow = Record<string, unknown>;
const mapRow = (row: AssessmentRow): Assessment => ({
  id: row.id as string,
  siteName: row.site_name as string,
  address: row.address as string,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  condition: row.condition as Assessment['condition'],
  chickenCount: Number(row.chicken_count),
  photos: (row.photos || []) as string[],
  notes: row.notes as string,
  assessor: row.assessor as string,
  access: row.access as Assessment['access'],
  urgency: row.urgency as Assessment['urgency'],
  structuralDamage: row.structural_damage as string,
  poultryImpact: row.poultry_impact as string,
  status: row.status as AssessmentStatus,
  createdAt: (row.created_at as Date).toISOString(),
  updatedAt: (row.updated_at as Date).toISOString(),
  reviewStatus: row.review_status as Assessment['reviewStatus'],
  adminComment: row.admin_comment as string,
  reviewedBy: row.reviewed_by as string | undefined,
  reviewedAt: row.reviewed_at
    ? (row.reviewed_at as Date).toISOString()
    : undefined,
});
const columns = `id, site_name, address, latitude, longitude, condition, chicken_count, photos, notes, assessor, access, urgency, structural_damage, poultry_impact, status, created_at, updated_at, review_status, admin_comment, reviewed_by, reviewed_at`;

export async function findAll(): Promise<Assessment[]> {
  const result = await pool.query(
    `SELECT ${columns} FROM assessments ORDER BY updated_at DESC`,
  );
  return result.rows.map(mapRow);
}
export async function findReviewStatus(
  id: string,
): Promise<Assessment['reviewStatus'] | null> {
  const result = await pool.query<{
    review_status: Assessment['reviewStatus'];
  }>('SELECT review_status FROM assessments WHERE id=$1', [id]);
  return result.rows[0]?.review_status || null;
}
export async function createOrUpdate(
  input: CreateAssessmentInput,
): Promise<Assessment> {
  const result = await pool.query(
    `INSERT INTO assessments (id,site_name,address,latitude,longitude,condition,chicken_count,photos,notes,assessor,access,urgency,structural_damage,poultry_impact,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,NOW()) ON CONFLICT (id) DO UPDATE SET site_name=EXCLUDED.site_name,address=EXCLUDED.address,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,condition=EXCLUDED.condition,chicken_count=EXCLUDED.chicken_count,photos=EXCLUDED.photos,notes=EXCLUDED.notes,assessor=EXCLUDED.assessor,access=EXCLUDED.access,urgency=EXCLUDED.urgency,structural_damage=EXCLUDED.structural_damage,poultry_impact=EXCLUDED.poultry_impact,status=EXCLUDED.status,updated_at=NOW() RETURNING ${columns}`,
    [
      input.id,
      input.siteName,
      input.address,
      input.latitude,
      input.longitude,
      input.condition,
      input.chickenCount,
      JSON.stringify(input.photos || []),
      input.notes || '',
      input.assessor || '',
      input.access || 'Open',
      input.urgency || 'Routine',
      input.structuralDamage || '',
      input.poultryImpact || '',
      input.status,
      input.createdAt || new Date().toISOString(),
    ],
  );
  return mapRow(result.rows[0]);
}
export async function updateStatus(
  id: string,
  status: AssessmentStatus,
): Promise<Assessment | null> {
  const result = await pool.query(
    `UPDATE assessments SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING ${columns}`,
    [status, id],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
export async function remove(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM assessments WHERE id=$1', [id]);
  return result.rowCount === 1;
}
