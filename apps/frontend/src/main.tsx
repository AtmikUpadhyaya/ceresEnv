import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Assessment,
  AssessmentSummary,
  User,
  ReviewStatus,
  CONDITIONS,
  ACCESS_OPTIONS,
  URGENCY_OPTIONS,
  CreateAssessmentInput,
  validateAssessment,
} from '@fieldready/shared';
import {
  deleteAssessment,
  getSummary,
  listAssessments,
  saveAssessment,
  ApiError,
} from './api/assessments';
import { enqueue, readQueue, writeQueue } from './storage/offlineQueue';
import { logout, readUser } from './api/auth';
import { AuthScreen } from './components/AuthScreens';
import { AdminPanel } from './components/AdminPanel';
import './styles.css';
type FormValues = Omit<
  Partial<CreateAssessmentInput>,
  'latitude' | 'longitude' | 'chickenCount'
> & {
  latitude?: string;
  longitude?: string;
  chickenCount?: string;
  reviewStatus?: ReviewStatus;
  adminComment?: string;
};
const empty: FormValues = {
  siteName: '',
  address: '',
  latitude: '',
  longitude: '',
  condition: 'Good',
  chickenCount: '',
  notes: '',
  assessor: '',
  access: 'Open',
  urgency: 'Routine',
  structuralDamage: '',
  poultryImpact: '',
  photos: [],
};
function App() {
  const portal = window.location.pathname.startsWith('/admin')
    ? 'admin'
    : 'assessor';
  const [user, setUser] = useState<User | null>(readUser()),
    [records, setRecords] = useState<Assessment[]>([]),
    [summary, setSummary] = useState<AssessmentSummary>(),
    [form, setForm] = useState<FormValues>(empty),
    [tab, setTab] = useState(portal === 'admin' ? 'admin' : 'sites'),
    [filter, setFilter] = useState('all'),
    [modal, setModal] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [notice, setNotice] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({});
  const refresh = async () => {
    if (!user) return;
    try {
      const [a, s] = await Promise.all([listAssessments(), getSummary()]);
      setRecords(a.data);
      setSummary(s.data);
    } catch {
      // API failures do not necessarily mean the device is offline.
      // The network badge is controlled only by browser online/offline events.
      setNotice('Unable to refresh records. Please try again shortly.');
    }
  };
  const sync = async () => {
    if (!navigator.onLine || !user) return;
    const pending = readQueue(user.id);
    const remaining: CreateAssessmentInput[] = [];
    for (const item of pending) {
      try {
        await saveAssessment(item);
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(user.id, remaining);
    refresh();
  };
  useEffect(() => {
    if (!user) return;
    refresh();
    sync();
    const on = () => {
      setOnline(true);
      sync();
    };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [user]);
  const visible = useMemo(
    () => records.filter((r) => filter === 'all' || r.status === filter),
    [records, filter],
  );
  const update = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  const openNew = () => {
    setForm(empty);
    setErrors({});
    setModal(true);
  };
  const submit = async (status: 'draft' | 'complete') => {
    if (!user) return;
    const record = {
      ...form,
      status,
      id: form.id || crypto.randomUUID(),
      createdAt: form.createdAt || new Date().toISOString(),
    } as unknown as CreateAssessmentInput;
    const validation = validateAssessment(record);
    if (Object.keys(validation).length) {
      setErrors(validation);
      setNotice('Complete the required fields first');
      return;
    }
    try {
      if (navigator.onLine) await saveAssessment(record);
      else throw new Error('offline');
      setNotice(status === 'draft' ? 'Draft saved' : 'Assessment saved');
    } catch (error) {
      if (!navigator.onLine || !(error instanceof ApiError)) {
        enqueue(user.id, record);
        setNotice('Saved on device — will sync later');
      } else {
        setNotice(error.message);
      }
    }
    setModal(false);
    refresh();
  };
  if (
    !user ||
    (portal === 'admin' && user.role !== 'admin') ||
    (portal === 'assessor' && user.role === 'admin')
  ) {
    return <AuthScreen portal={portal} onAuthenticated={setUser} />;
  }
  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo">⌁</span>
          <span>
            Field<span>Ready</span>
          </span>
        </div>
        <div className={`network ${online ? 'online' : ''}`}>
          <i /> {online ? 'Online' : 'Offline'}
          {readQueue(user.id).length
            ? ` · ${readQueue(user.id).length} queued`
            : ''}
        </div>
        <button
          className="help"
          onClick={() =>
            setNotice(
              'Offline records sync automatically when a connection returns.',
            )
          }
        >
          ?
        </button>
        <span className="user-chip">
          {user.name} · {user.role}
        </span>
        <button
          className="logout"
          onClick={() => {
            logout();
            setUser(null);
          }}
        >
          Sign out
        </button>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">MADISON COUNTY · NC</div>
          <div className="hero-grid">
            <div>
              <h1>
                Flood damage
                <br />
                <em>assessment.</em>
              </h1>
              <p>
                Capture site conditions in the field. Keep working when
                connectivity is limited.
              </p>
            </div>
            <div className="hero-chip">
              FIELD
              <br />
              <b>READY</b>
            </div>
          </div>
          <div className="stats">
            <div>
              <b>{summary?.totalSites ?? records.length}</b>
              <span>sites logged</span>
            </div>
            <div>
              <b>{summary?.totalChickens?.toLocaleString() ?? 0}</b>
              <span>chickens counted</span>
            </div>
            <div>
              <b>{summary?.urgentSites ?? 0}</b>
              <span>urgent sites</span>
            </div>
          </div>
        </section>
        <nav className="tabs">
          <button
            className={tab === 'sites' ? 'active' : ''}
            onClick={() => setTab('sites')}
          >
            Assessments
          </button>
          <button
            className={tab === 'report' ? 'active' : ''}
            onClick={() => setTab('report')}
          >
            County summary
          </button>
          {user.role === 'admin' && (
            <button
              className={tab === 'admin' ? 'active' : ''}
              onClick={() => setTab('admin')}
            >
              Admin review
            </button>
          )}
        </nav>
        {tab === 'admin' && user.role === 'admin' ? (
          <AdminPanel records={records} onReviewed={refresh} />
        ) : tab === 'report' ? (
          <Report summary={summary} records={records} />
        ) : (
          <>
            <div className="section-head">
              <div>
                <span className="kicker">FIELD WORK</span>
                <h2>Site assessments</h2>
              </div>
              <button className="primary" onClick={openNew}>
                + New assessment
              </button>
            </div>
            <div className="filters">
              {[
                ['all', 'All'],
                ['draft', 'Drafts'],
                ['complete', 'Complete'],
              ].map(([key, label]) => (
                <button
                  className={filter === key ? 'active' : ''}
                  key={key}
                  onClick={() => setFilter(key)}
                >
                  {label}{' '}
                  <b>
                    {key === 'all'
                      ? records.length
                      : records.filter((r) => r.status === key).length}
                  </b>
                </button>
              ))}
            </div>
            {visible.map((r) => (
              <article
                className="card"
                key={r.id}
                onClick={() => {
                  setForm({
                    ...r,
                    latitude: String(r.latitude),
                    longitude: String(r.longitude),
                    chickenCount: String(r.chickenCount),
                  });
                  setModal(true);
                }}
              >
                <span className={`dot ${r.status}`} />
                <div className="card-copy">
                  <strong>{r.siteName}</strong>
                  <small>
                    {r.address} · {new Date(r.updatedAt).toLocaleDateString()}
                  </small>
                </div>
                <span className="pill">{r.condition}</span>
                <span className="arrow">›</span>
                {r.reviewStatus !== 'pending' && (
                  <span className="locked">🔒</span>
                )}
                <button
                  className="delete"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this assessment?')) {
                      await deleteAssessment(r.id);
                      refresh();
                    }
                  }}
                >
                  ×
                </button>
              </article>
            ))}
            {!visible.length && (
              <div className="empty">
                <span>⌖</span>
                <h3>No assessments in this view</h3>
                <p>
                  Start with the first farm you visit. Records are stored
                  locally if the network is unavailable.
                </p>
                <button className="primary" onClick={openNew}>
                  Start assessment
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <footer>
        <span>FieldReady v1.0 · data stored locally when offline</span>
        <span>Madison County field operations</span>
      </footer>
      {notice && (
        <div className="toast" onClick={() => setNotice('')}>
          {notice}
        </div>
      )}
      {modal && (
        <AssessmentModal
          form={form}
          readOnly={Boolean(
            form.id && form.reviewStatus && form.reviewStatus !== 'pending',
          )}
          update={update}
          errors={errors}
          onClose={() => setModal(false)}
          onSave={submit}
        />
      )}
    </div>
  );
}
function AssessmentModal({
  form,
  readOnly,
  update,
  errors,
  onClose,
  onSave,
}: {
  form: FormValues;
  readOnly: boolean;
  update: (key: string, value: unknown) => void;
  errors: Record<string, string>;
  onClose: () => void;
  onSave: (status: 'draft' | 'complete') => void;
}) {
  const [step, setStep] = useState(1);
  const field = (
    name: keyof CreateAssessmentInput,
    label: string,
    type = 'text',
    extra: Record<string, unknown> = {},
  ) => (
    <label>
      {label}
      <input
        type={type}
        value={(form[name] ?? '') as string | number}
        onChange={(e) => update(name, e.target.value)}
        readOnly={readOnly}
        {...extra}
      />
      {errors[name] && <small className="error">{errors[name]}</small>}
    </label>
  );
  return (
    <div className="backdrop">
      <section className="modal">
        <div className="modal-top">
          <div>
            <span className="kicker">SITE RECORD</span>
            <h2>Farm assessment</h2>
          </div>
          <button className="close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="progress">
          {[1, 2, 3].map((n) => (
            <span className={n <= step ? 'active' : ''} key={n} />
          ))}
        </div>
        {step === 1 && (
          <div className="step">
            <h3>01 · Site basics</h3>
            {form.reviewStatus && (
              <div className={`review-notice ${form.reviewStatus}`}>
                <strong>Admin review: {form.reviewStatus}</strong>
                {form.adminComment && <p>{form.adminComment}</p>}
              </div>
            )}
            <p className="helper">
              Required: name, address, latitude, and longitude.
            </p>
            {field('siteName', 'Farm / site name', 'text', {
              placeholder: 'Henderson Poultry Farm',
            })}
            {field('address', 'Street address', 'text', {
              placeholder: 'Street, city, NC',
            })}
            <div className="two">
              {field('latitude', 'Latitude', 'number', {
                step: 'any',
                placeholder: '35.5951',
              })}
              {field('longitude', 'Longitude', 'number', {
                step: 'any',
                placeholder: '-82.5515',
              })}
            </div>
            <button
              className="location"
              disabled={readOnly}
              onClick={() =>
                navigator.geolocation?.getCurrentPosition((p) => {
                  update('latitude', p.coords.latitude.toFixed(6));
                  update('longitude', p.coords.longitude.toFixed(6));
                })
              }
            >
              ⌖ Use my current location
            </button>
            {field('assessor', 'Assessor name', 'text', {
              placeholder: 'Field team member',
            })}
            <div className="actions">
              <button className="link" onClick={onClose}>
                Cancel
              </button>
              <button className="primary" onClick={() => setStep(2)}>
                Continue →
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="step">
            <h3>02 · Condition & impact</h3>
            <p className="helper">
              Record condition, livestock impact, and access for follow-up.
            </p>
            <label>
              Farm condition
              <div className="choices">
                {CONDITIONS.map((c) => (
                  <button
                    type="button"
                    className={form.condition === c ? 'selected' : ''}
                    key={c}
                    disabled={readOnly}
                    onClick={() => update('condition', c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
            {field('chickenCount', 'Total number of chickens', 'number', {
              min: 0,
              placeholder: 'e.g. 1200',
            })}
            <div className="two">
              <label>
                Site access
                <select
                  disabled={readOnly}
                  value={form.access as string}
                  onChange={(e) => update('access', e.target.value)}
                >
                  {ACCESS_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Response urgency
                <select
                  disabled={readOnly}
                  value={form.urgency as string}
                  onChange={(e) => update('urgency', e.target.value)}
                >
                  {URGENCY_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            {field('structuralDamage', 'Structural damage', 'text', {
              placeholder: 'Coops, feed stores, utilities…',
            })}
            {field('poultryImpact', 'Poultry / livestock impact', 'text', {
              placeholder: 'Losses, relocation, water or feed needs…',
            })}
            <div className="actions">
              <button className="link" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="primary" onClick={() => setStep(3)}>
                Continue →
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="step">
            <h3>03 · Evidence & notes</h3>
            <p className="helper">
              Add up to 5 photos. They are retained in the local queue until
              synced.
            </p>
            <label className="upload">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                disabled={readOnly}
                onChange={async (e) => {
                  const photos = await Promise.all(
                    Array.from(e.target.files ?? [])
                      .slice(0, 5)
                      .map(
                        (file) =>
                          new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () =>
                              resolve(reader.result as string);
                            reader.readAsDataURL(file);
                          }),
                      ),
                  );
                  update(
                    'photos',
                    [...(form.photos || []), ...photos].slice(0, 5),
                  );
                }}
              />
              <span>◉</span>
              <strong>Tap to add photos</strong>
              <small>
                Camera or photo library · {(form.photos || []).length}/5
              </small>
            </label>
            {(form.photos || []).length > 0 && (
              <div className="previews">
                {(form.photos || []).map((photo, i) => (
                  <img key={i} src={photo} alt="Site evidence" />
                ))}
              </div>
            )}
            <label>
              Field notes
              <textarea
                rows={5}
                value={form.notes as string}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Floodwater, visible damage, access concerns, immediate needs…"
              />
            </label>
            <div className="actions">
              <button className="link" onClick={() => setStep(2)}>
                ← Back
              </button>
              <div>
                {readOnly ? (
                  <button className="primary" onClick={onClose}>
                    Close
                  </button>
                ) : (
                  <>
                    <button className="link" onClick={() => onSave('draft')}>
                      Save draft
                    </button>
                    <button
                      className="primary"
                      onClick={() => onSave('complete')}
                    >
                      Save assessment ✓
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
function Report({
  summary,
  records,
}: {
  summary?: AssessmentSummary;
  records: Assessment[];
}) {
  return (
    <section className="report">
      <div className="section-head">
        <div>
          <span className="kicker">REPORTING</span>
          <h2>County summary</h2>
        </div>
        <span className="report-date">
          Updated {new Date().toLocaleDateString()}
        </span>
      </div>
      <div className="report-grid">
        <div>
          <b>{summary?.totalSites || 0}</b>
          <span>Total sites</span>
        </div>
        <div>
          <b>{summary?.totalChickens?.toLocaleString() || 0}</b>
          <span>Chickens assessed</span>
        </div>
        <div>
          <b>{summary?.urgentSites || 0}</b>
          <span>Immediate response</span>
        </div>
      </div>
      <div className="report-panel">
        <h3>Condition breakdown</h3>
        {CONDITIONS.map((c) => (
          <div className="bar-row" key={c}>
            <span>{c}</span>
            <div>
              <i
                className={c.toLowerCase()}
                style={{
                  width: `${summary?.totalSites ? (summary.byCondition[c] / summary.totalSites) * 100 : 0}%`,
                }}
              />
            </div>
            <b>{summary?.byCondition[c] || 0}</b>
          </div>
        ))}
      </div>
      <div className="report-panel">
        <h3>Field notes to review</h3>
        {records
          .filter((r) => r.urgency !== 'Routine')
          .slice(0, 5)
          .map((r) => (
            <div className="review" key={r.id}>
              <span className="pill">{r.urgency}</span>
              <div>
                <strong>{r.siteName}</strong>
                <small>
                  {r.poultryImpact || r.notes || 'No additional notes'}
                </small>
              </div>
            </div>
          ))}
        {!records.some((r) => r.urgency !== 'Routine') && (
          <p className="muted">No follow-up flags yet.</p>
        )}
      </div>
    </section>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
