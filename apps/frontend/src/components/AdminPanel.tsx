import { useMemo, useState } from 'react';
import {
  ACCESS_OPTIONS,
  Assessment,
  CONDITIONS,
  ReviewStatus,
  URGENCY_OPTIONS,
} from '@fieldready/shared';
import { reviewAssessment } from '../api/assessments';

const reviewStatuses: Array<ReviewStatus | 'all'> = [
  'all',
  'pending',
  'approved',
  'failed',
  'flagged',
];

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
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesReview =
        reviewFilter === 'all' || record.reviewStatus === reviewFilter;
      const matchesCondition =
        conditionFilter === 'all' || record.condition === conditionFilter;
      const matchesUrgency =
        urgencyFilter === 'all' || record.urgency === urgencyFilter;
      const matchesAccess =
        accessFilter === 'all' || record.access === accessFilter;
      const matchesSearch =
        !term ||
        `${record.siteName} ${record.address} ${record.assessor}`
          .toLowerCase()
          .includes(term);
      return (
        matchesReview &&
        matchesCondition &&
        matchesUrgency &&
        matchesAccess &&
        matchesSearch
      );
    });
  }, [
    accessFilter,
    conditionFilter,
    records,
    reviewFilter,
    search,
    urgencyFilter,
  ]);

  const metrics = useMemo(() => {
    const count = (predicate: (record: Assessment) => boolean) =>
      filteredRecords.filter(predicate).length;
    return {
      complete: count((record) => record.status === 'complete'),
      urgent: count((record) => record.urgency === 'Immediate response'),
      chickens: filteredRecords.reduce(
        (total, record) => total + record.chickenCount,
        0,
      ),
      approved: count((record) => record.reviewStatus === 'approved'),
      byCondition: CONDITIONS.map((condition) => ({
        label: condition,
        value: count((record) => record.condition === condition),
      })),
      byReview: reviewStatuses.slice(1).map((reviewStatus) => ({
        label: reviewStatus,
        value: count((record) => record.reviewStatus === reviewStatus),
      })),
    };
  }, [filteredRecords]);

  const conditionPie = useMemo(() => {
    const total = metrics.byCondition.reduce(
      (sum, item) => sum + item.value,
      0,
    );
    let start = 0;
    const colors = ['#5a9b73', '#d6a34f', '#c96252'];
    const segments = metrics.byCondition.map((item, index) => {
      const end = total ? start + (item.value / total) * 100 : 0;
      const segment = `${colors[index]} ${start}% ${end}%`;
      start = end;
      return {
        ...item,
        color: colors[index],
        percentage: total ? (item.value / total) * 100 : 0,
        segment,
      };
    });
    return { total, segments };
  }, [metrics.byCondition]);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await reviewAssessment(selected.id, status, comment);
      setSelected(null);
      setComment('');
      onReviewed();
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setReviewFilter('all');
    setConditionFilter('all');
    setUrgencyFilter('all');
    setAccessFilter('all');
    setSearch('');
  };

  const selectClass = 'admin-filter';

  return (
    <section className="admin-panel">
      <div className="section-head">
        <div>
          <span className="kicker">ADMIN REVIEW</span>
          <h2>Review queue</h2>
        </div>
        <span className="report-date">
          {filteredRecords.length} of {records.length} records
        </span>
      </div>
      <div className="admin-filters">
        <input
          aria-label="Search assessments"
          placeholder="Search site, address, assessor…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className={selectClass}
          value={reviewFilter}
          onChange={(event) =>
            setReviewFilter(event.target.value as ReviewStatus | 'all')
          }
        >
          <option value="all">All review statuses</option>
          {reviewStatuses.slice(1).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={conditionFilter}
          onChange={(event) => setConditionFilter(event.target.value)}
        >
          <option value="all">All conditions</option>
          {CONDITIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className={selectClass}
          value={urgencyFilter}
          onChange={(event) => setUrgencyFilter(event.target.value)}
        >
          <option value="all">All urgency levels</option>
          {URGENCY_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className={selectClass}
          value={accessFilter}
          onChange={(event) => setAccessFilter(event.target.value)}
        >
          <option value="all">All access statuses</option>
          {ACCESS_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="link filter-reset" onClick={resetFilters}>
          Reset filters
        </button>
      </div>
      <div className="metric-grid">
        <div>
          <strong>{filteredRecords.length}</strong>
          <span>Sites shown</span>
        </div>
        <div>
          <strong>{metrics.complete}</strong>
          <span>Completed</span>
        </div>
        <div>
          <strong>{metrics.urgent}</strong>
          <span>Immediate response</span>
        </div>
        <div>
          <strong>{metrics.chickens.toLocaleString()}</strong>
          <span>Chickens affected</span>
        </div>
        <div>
          <strong>{metrics.approved}</strong>
          <span>Approved</span>
        </div>
      </div>
      <div className="chart-grid">
        <div className="chart-card pie-card">
          <h3>Condition distribution</h3>
          <div className="pie-layout">
            <div
              className="pie-chart"
              style={{
                background: conditionPie.total
                  ? `conic-gradient(${conditionPie.segments.map((item) => item.segment).join(', ')})`
                  : '#edf1ec',
              }}
              aria-label="Assessment distribution by condition"
              role="img"
            >
              <span>{conditionPie.total}</span>
              <small>sites</small>
            </div>
            <div className="pie-legend">
              {conditionPie.segments.map((item) => (
                <div key={item.label}>
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>
                    {item.value} ({item.percentage.toFixed(0)}%)
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        {[
          ['Condition breakdown', metrics.byCondition],
          ['Review breakdown', metrics.byReview],
        ].map(([title, items]) => {
          const chartItems = items as Array<{ label: string; value: number }>;
          const max = Math.max(...chartItems.map((item) => item.value), 1);
          return (
            <div className="chart-card" key={title as string}>
              <h3>{title as string}</h3>
              {chartItems.map((item) => (
                <div className="chart-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="chart-track">
                    <i style={{ width: `${(item.value / max) * 100}%` }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="review-list">
        {filteredRecords.map((record) => (
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
      {!filteredRecords.length && (
        <div className="empty">
          <h3>No matching records</h3>
          <p>Try adjusting the dashboard filters.</p>
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
              onChange={(event) =>
                setStatus(event.target.value as ReviewStatus)
              }
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
              onChange={(event) => setComment(event.target.value)}
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
