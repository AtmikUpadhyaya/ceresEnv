import { useState } from 'react';
import { Assessment, ReviewStatus } from '@fieldready/shared';
import { reviewAssessment } from '../api/assessments';

export function AdminPanel({
  records,
  onReviewed,
}: {
  records: Assessment[];
  onReviewed: () => void;
}) {
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [status, setStatus] = useState<ReviewStatus>('approved');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    await reviewAssessment(selected.id, status, comment);
    setSaving(false);
    setSelected(null);
    setComment('');
    onReviewed();
  };
  return (
    <section className="admin-panel">
      <div className="section-head">
        <div>
          <span className="kicker">ADMIN REVIEW</span>
          <h2>Review queue</h2>
        </div>
        <span className="report-date">{records.length} records</span>
      </div>
      <div className="review-list">
        {records.map((record) => (
          <button
            className="review-row"
            key={record.id}
            onClick={() => {
              setSelected(record);
              setStatus(record.reviewStatus || 'pending');
              setComment(record.adminComment || '');
            }}
          >
            <div>
              <strong>{record.siteName}</strong>
              <small>
                {record.address} · submitted by{' '}
                {record.assessor || 'field team'}
              </small>
            </div>
            <span
              className={`review-badge ${record.reviewStatus || 'pending'}`}
            >
              {record.reviewStatus || 'pending'}
            </span>
            <span>›</span>
          </button>
        ))}
      </div>
      {!records.length && (
        <div className="empty">
          <h3>No submitted records</h3>
          <p>Assessments submitted by field teams will appear here.</p>
        </div>
      )}
      {selected && (
        <div className="review-editor">
          <div className="modal-top">
            <div>
              <span className="kicker">REVIEWING</span>
              <h3>{selected.siteName}</h3>
            </div>
            <button className="close" onClick={() => setSelected(null)}>
              ×
            </button>
          </div>
          <label>
            Decision
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReviewStatus)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="failed">Failed</option>
              <option value="flagged">Flagged</option>
            </select>
          </label>
          <label>
            Admin comment
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain the decision or request follow-up…"
            />
          </label>
          <button className="primary" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save review decision'}
          </button>
        </div>
      )}
    </section>
  );
}
