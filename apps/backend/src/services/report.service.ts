import { AssessmentSummary, Condition } from '@fieldready/shared';
import { pool } from '../db/pool.js';
export async function getSummary(
  userId: string,
  isAdmin: boolean,
): Promise<AssessmentSummary> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total_sites, COUNT(*) FILTER (WHERE status='complete')::int AS complete_sites, COUNT(*) FILTER (WHERE status='draft')::int AS draft_sites, COALESCE(SUM(chicken_count),0)::int AS total_chickens, COUNT(*) FILTER (WHERE urgency='Immediate response')::int AS urgent_sites, COUNT(*) FILTER (WHERE condition='Good')::int AS good, COUNT(*) FILTER (WHERE condition='Moderate')::int AS moderate, COUNT(*) FILTER (WHERE condition='Bad')::int AS bad FROM assessments ${isAdmin ? '' : 'WHERE created_by=$1'}`,
    isAdmin ? [] : [userId],
  );
  const r = result.rows[0];
  return {
    totalSites: r.total_sites,
    completeSites: r.complete_sites,
    draftSites: r.draft_sites,
    totalChickens: r.total_chickens,
    urgentSites: r.urgent_sites,
    byCondition: { Good: r.good, Moderate: r.moderate, Bad: r.bad } as Record<
      Condition,
      number
    >,
  };
}
