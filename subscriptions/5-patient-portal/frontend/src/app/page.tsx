'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getStats, listSubscriptions, getSubscription, getPscLocations,
  pauseSubscription, resumeSubscription, cancelSubscription,
  delaySubscription, scheduleLab,
} from '@/lib/api';

const CANCEL_REASONS = [
  'I am experiencing too many side effects',
  'Completed the current treatment',
  'Too expensive',
  "Using another company's product",
  'Health or medical reasons',
  'Others',
];

type DetailTab = 'overview' | 'billing' | 'actions' | 'lab';

interface Subscription {
  id?: string;
  subscriptionId?: string;
  status?: string;
  planName?: string;
  subscriptionPlanName?: string;
  nextFulfillmentDate?: string;
  pausedUntilDate?: string;
  price?: number;
  planPrice?: number;
  fulfillmentCycle?: string;
  fulfillmentInterval?: number;
  [key: string]: unknown;
}

interface Stats { total?: number; active?: number; paused?: number; cancelled?: number; [key: string]: unknown; }
interface LabLocation { id?: string; name?: string; address?: string; city?: string; state?: string; zip?: string; bookingKey?: string; phone?: string; [key: string]: unknown; }

const badgeClass = (s?: string) => {
  const m: Record<string, string> = { ACTIVE: 'badge-active', PAUSED: 'badge-paused', CANCELLED: 'badge-cancelled', PENDING: 'badge-pending', PAYMENT_FAILED: 'badge-payment-failed', EXPIRED: 'badge-expired' };
  return `badge ${m[s ?? ''] ?? 'badge-cancelled'}`;
};

const canDo = (action: string, status?: string) => {
  const rules: Record<string, string[]> = {
    pause: ['ACTIVE'], resume: ['PAUSED'], cancel: ['ACTIVE', 'PAUSED', 'PENDING'],
    delay: ['ACTIVE'], lab: ['ACTIVE', 'PENDING'],
  };
  return (rules[action] ?? []).includes(status ?? '');
};

export default function PatientPortalPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Detail panel
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [billingOpen, setBillingOpen] = useState(true);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionResult, setActionResult] = useState<unknown>(null);
  const [pauseUntil, setPauseUntil] = useState('');
  const [newFulfillDate, setNewFulfillDate] = useState('');
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelDesc, setCancelDesc] = useState('');
  const [showActionForm, setShowActionForm] = useState<string | null>(null);

  // Lab
  const [zipCode, setZipCode] = useState('');
  const [labLocations, setLabLocations] = useState<LabLocation[]>([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState('');
  const [selectedLab, setSelectedLab] = useState<LabLocation | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleResult, setScheduleResult] = useState<unknown>(null);

  const fetchStats = useCallback(async () => {
    try { setStats(await getStats() as Stats); } catch { /* non-critical */ }
  }, []);

  const fetchList = useCallback(async () => {
    setListLoading(true); setListError('');
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const data = await listSubscriptions(params) as { data?: Subscription[] } | Subscription[];
      setSubscriptions(Array.isArray(data) ? data : ((data as { data?: Subscription[] }).data ?? []));
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to load subscriptions');
    } finally { setListLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchList(); fetchStats(); }, [fetchList, fetchStats]);

  const selectSub = async (sub: Subscription) => {
    setSelected(sub);
    setDetail(null);
    setActiveTab('overview');
    setActionResult(null);
    setActionError('');
    setShowActionForm(null);
    setScheduleResult(null);
    setLabLocations([]);
    setSelectedLab(null);
    const id = String(sub.id ?? sub.subscriptionId ?? '');
    if (!id) return;
    setDetailLoading(true);
    try {
      const d = await getSubscription(id) as Record<string, unknown>;
      setDetail(d);
    } catch { /* use list data */ } finally { setDetailLoading(false); }
  };

  const handleAction = async (action: string) => {
    if (!selected) return;
    const id = String(selected.id ?? selected.subscriptionId ?? '');
    setActionLoading(true); setActionError(''); setActionResult(null);
    try {
      let result: unknown;
      if (action === 'pause')   result = await pauseSubscription(id, pauseUntil || undefined);
      if (action === 'resume')  result = await resumeSubscription(id);
      if (action === 'cancel')  result = await cancelSubscription(id, cancelReason, cancelDesc || undefined);
      if (action === 'delay')   result = await delaySubscription(id, newFulfillDate);
      setActionResult(result);
      setShowActionForm(null);
      fetchList(); fetchStats();
      const r = result as { subscription?: { status?: string } };
      if (r?.subscription?.status) setSelected(p => p ? { ...p, status: r.subscription!.status } : p);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionLoading(false); }
  };

  const handleLabSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) return;
    setLabLoading(true); setLabError(''); setLabLocations([]); setSelectedLab(null);
    try {
      const data = await getPscLocations(zipCode.trim()) as { locations?: LabLocation[] } | LabLocation[];
      setLabLocations(Array.isArray(data) ? data : ((data as { locations?: LabLocation[] }).locations ?? []));
    } catch (e: unknown) {
      setLabError(e instanceof Error ? e.message : 'Failed to load PSC locations');
    } finally { setLabLoading(false); }
  };

  const handleScheduleLab = async () => {
    if (!selected || !selectedLab?.bookingKey) return;
    const id = String(selected.id ?? selected.subscriptionId ?? '');
    setScheduleLoading(true); setScheduleError(''); setScheduleResult(null);
    try {
      const result = await scheduleLab(id, selectedLab.bookingKey);
      setScheduleResult(result);
      fetchList();
    } catch (e: unknown) {
      setScheduleError(e instanceof Error ? e.message : 'Lab scheduling failed');
    } finally { setScheduleLoading(false); }
  };

  const planName = (s: Subscription) => String(s.planName ?? s.subscriptionPlanName ?? 'Subscription Plan');
  const subId = (s: Subscription) => String(s.subscriptionId ?? s.id ?? '');
  const billingInfo = detail?.billingInformation as Record<string, unknown> | null | undefined;
  const subInfo = detail?.subscriptionInformation as Record<string, unknown> | null | undefined;

  return (
    <div className="container">
      <h1>Patient Portal</h1>
      <p className="subtitle">
        Patient self-service — view subscriptions, manage billing, and schedule lab appointments
        via <code>/tenants/patient-subscriptions</code>.
      </p>

      {/* Stats */}
      <div className="stats-bar">
        {[
          { key: 'total', label: 'My Plans', cls: 'total' },
          { key: 'active', label: 'Active', cls: 'active' },
          { key: 'paused', label: 'Paused', cls: 'paused' },
          { key: 'cancelled', label: 'Cancelled', cls: 'cancelled' },
        ].map(({ key, label, cls }) => (
          <div key={key} className={`stat-card ${cls}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{stats ? (stats[key] ?? '0') : '—'}</div>
          </div>
        ))}
      </div>

      <div className="layout">
        {/* ── Subscription List ── */}
        <div className="col-list">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '0.875rem', background: '#fff' }}>
              <option value="all">All</option>
              {['ACTIVE', 'PAUSED', 'CANCELLED', 'PENDING', 'PAYMENT_FAILED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-sm btn-secondary" onClick={() => { fetchList(); fetchStats(); }} disabled={listLoading}>
              {listLoading ? '…' : 'Refresh'}
            </button>
          </div>

          {listError && <div className="error-box">{listError}</div>}
          {listLoading && <p className="empty-state">Loading…</p>}

          {!listLoading && subscriptions.length === 0 && !listError && (
            <p className="empty-state">No subscriptions found.</p>
          )}

          {subscriptions.map((sub, i) => {
            const id = subId(sub);
            const isSelected = selected && subId(selected) === id;
            return (
              <div key={id || i} className={`sub-card ${isSelected ? 'selected' : ''}`} onClick={() => selectSub(sub)}>
                <div className="sub-card-header">
                  <div>
                    <div className="sub-card-name">{planName(sub)}</div>
                    <div className="sub-card-id">{id}</div>
                  </div>
                  <span className={badgeClass(sub.status)}>{sub.status ?? '—'}</span>
                </div>
                <div className="sub-card-meta">
                  {sub.nextFulfillmentDate && (
                    <span>Next billing: <strong>{new Date(String(sub.nextFulfillmentDate)).toLocaleDateString()}</strong></span>
                  )}
                  {(sub.price ?? sub.planPrice) != null && (
                    <span>Price: <strong>${Number(sub.price ?? sub.planPrice).toFixed(2)}</strong></span>
                  )}
                  {sub.fulfillmentCycle && (
                    <span>Cycle: <strong>Every {sub.fulfillmentInterval} {String(sub.fulfillmentCycle).toLowerCase()}</strong></span>
                  )}
                  {sub.pausedUntilDate && (
                    <span style={{ color: '#d69e2e' }}>Paused until: <strong>{new Date(String(sub.pausedUntilDate)).toLocaleDateString()}</strong></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detail Panel ── */}
        <div className="col-detail">
          {!selected ? (
            <div className="card">
              <p style={{ color: '#a0aec0', fontSize: '0.875rem', textAlign: 'center', padding: '28px 0' }}>
                ← Select a subscription to view details
              </p>
            </div>
          ) : (
            <div className="card">
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{planName(selected)}</div>
                <span className={badgeClass(selected.status)}>{selected.status}</span>
              </div>

              <div className="tabs">
                {(['overview', 'billing', 'actions', 'lab'] as DetailTab[]).map(t => (
                  <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
                    onClick={() => setActiveTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                detailLoading ? <p className="empty-state">Loading…</p> : (
                  <>
                    {[
                      ['Subscription ID', subId(selected)],
                      ['Status', selected.status ?? '—'],
                      ['Next Fulfillment', selected.nextFulfillmentDate ? new Date(String(selected.nextFulfillmentDate)).toLocaleDateString() : '—'],
                      ['Plan Price', (selected.price ?? selected.planPrice) != null ? `$${Number(selected.price ?? selected.planPrice).toFixed(2)}` : '—'],
                      ['Cycle', selected.fulfillmentCycle ? `Every ${selected.fulfillmentInterval} ${String(selected.fulfillmentCycle).toLowerCase()}` : '—'],
                      ...(subInfo ? [
                        ['Effective Date', subInfo.effectiveDate ? new Date(String(subInfo.effectiveDate)).toLocaleDateString() : '—'],
                        ['Renewals Left', subInfo.maxRenewal != null ? String(subInfo.maxRenewal) : 'Unlimited'],
                      ] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="billing-row">
                        <span className="billing-key">{k}</span>
                        <span className="billing-val mono" style={{ maxWidth: '180px', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                    {detail && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#718096', fontSize: '12px' }}>Full JSON</summary>
                        <div className="result-box" style={{ marginTop: '6px' }}>
                          <pre>{JSON.stringify(detail, null, 2)}</pre>
                        </div>
                      </details>
                    )}
                  </>
                )
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                detailLoading ? <p className="empty-state">Loading…</p> :
                !billingInfo ? <p className="empty-state">No billing information available.</p> : (
                  <>
                    <button className="accordion-toggle" onClick={() => setBillingOpen(o => !o)}>
                      <h3 style={{ margin: 0 }}>Billing Breakdown</h3>
                      <span style={{ fontSize: '1.2rem', color: '#a0aec0' }}>{billingOpen ? '−' : '+'}</span>
                    </button>
                    {billingOpen && (
                      <div style={{ marginTop: '12px' }}>
                        {Object.entries(billingInfo).map(([k, v]) => (
                          <div key={k} className="billing-row">
                            <span className="billing-key" style={{ textTransform: 'capitalize' }}>
                              {k.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="billing-val">
                              {typeof v === 'number' ? `$${v.toFixed(2)}` : v != null ? String(v) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <>
                  <div className="action-grid">
                    {[
                      { key: 'pause',  label: 'Pause',       cls: 'btn-warning' },
                      { key: 'resume', label: 'Resume',      cls: 'btn-success' },
                      { key: 'delay',  label: 'Delay Cycle', cls: 'btn-primary' },
                      { key: 'cancel', label: 'Cancel',      cls: 'btn-danger'  },
                    ].map(({ key, label, cls }) => (
                      <button key={key}
                        className={`btn btn-sm ${canDo(key, selected.status) ? cls : 'btn-ghost'}`}
                        disabled={!canDo(key, selected.status)}
                        onClick={() => { setShowActionForm(f => f === key ? null : key); setActionResult(null); setActionError(''); }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {showActionForm === 'pause' && (
                    <div style={{ marginBottom: '14px' }}>
                      <div className="form-group">
                        <label>Resume automatically on</label>
                        <input type="date" value={pauseUntil} onChange={e => setPauseUntil(e.target.value)} />
                        <span className="hint">Leave blank for indefinite pause</span>
                      </div>
                      <button className="btn btn-sm btn-warning" disabled={actionLoading} onClick={() => handleAction('pause')}>
                        {actionLoading ? 'Pausing…' : 'Confirm Pause'}
                      </button>
                    </div>
                  )}

                  {showActionForm === 'delay' && (
                    <div style={{ marginBottom: '14px' }}>
                      <div className="form-group">
                        <label>New Fulfillment Date *</label>
                        <input type="date" value={newFulfillDate} onChange={e => setNewFulfillDate(e.target.value)} />
                      </div>
                      <button className="btn btn-sm btn-primary" disabled={actionLoading || !newFulfillDate}
                        onClick={() => handleAction('delay')}>
                        {actionLoading ? 'Saving…' : 'Confirm Delay'}
                      </button>
                    </div>
                  )}

                  {showActionForm === 'cancel' && (
                    <div style={{ marginBottom: '14px' }}>
                      <div className="form-group">
                        <label>Reason *</label>
                        <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                          {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Additional notes</label>
                        <textarea value={cancelDesc} onChange={e => setCancelDesc(e.target.value)} placeholder="Optional…" />
                      </div>
                      <button className="btn btn-sm btn-danger" disabled={actionLoading} onClick={() => handleAction('cancel')}>
                        {actionLoading ? 'Cancelling…' : 'Confirm Cancellation'}
                      </button>
                    </div>
                  )}

                  {showActionForm === 'resume' && (
                    <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => handleAction('resume')}>
                      {actionLoading ? 'Resuming…' : 'Confirm Resume'}
                    </button>
                  )}

                  {actionResult && (
                    <div className="result-box">
                      <div style={{ color: '#276749', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Done</div>
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#718096', fontSize: '12px' }}>Raw response</summary>
                        <pre style={{ marginTop: '6px' }}>{JSON.stringify(actionResult, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                  {actionError && <div className="error-box">{actionError}</div>}
                </>
              )}

              {/* Lab Tab */}
              {activeTab === 'lab' && (
                <>
                  <p style={{ fontSize: '0.8125rem', color: '#718096', marginBottom: '14px' }}>
                    Search PSC lab locations by ZIP, pick one, and book an appointment.
                  </p>

                  <form onSubmit={handleLabSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)}
                      placeholder="ZIP code" style={{ flex: 1 }} required />
                    <button type="submit" className="btn btn-sm btn-primary" disabled={labLoading}>
                      {labLoading ? '…' : 'Search'}
                    </button>
                  </form>

                  {labError && <div className="error-box">{labError}</div>}

                  {labLocations.length === 0 && !labLoading && !labError && zipCode && (
                    <p className="empty-state">No PSC locations found.</p>
                  )}

                  {labLocations.map((loc, i) => (
                    <div key={loc.id ?? i} className={`lab-card`}
                      style={{ cursor: 'pointer', border: selectedLab?.id === loc.id ? '2px solid #4299e1' : undefined }}
                      onClick={() => setSelectedLab(loc)}>
                      <div className="lab-name">{loc.name ?? `Lab ${i + 1}`}</div>
                      <div className="lab-address">
                        {[loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                      </div>
                      {loc.phone && <div style={{ fontSize: '0.8125rem', color: '#718096' }}>{loc.phone}</div>}
                      {selectedLab?.id === loc.id && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#4299e1' }}>✓ Selected</div>
                      )}
                    </div>
                  ))}

                  {selectedLab && !scheduleResult && (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#4a5568', marginBottom: '10px' }}>
                        Schedule at: <strong>{selectedLab.name}</strong>
                      </div>
                      <button className="btn btn-success" disabled={scheduleLoading || !canDo('lab', selected.status)}
                        onClick={handleScheduleLab}>
                        {scheduleLoading ? 'Scheduling…' : 'Book Appointment'}
                      </button>
                      {!canDo('lab', selected.status) && (
                        <p style={{ fontSize: '0.8rem', color: '#e53e3e', marginTop: '6px' }}>
                          Lab scheduling requires ACTIVE or PENDING status.
                        </p>
                      )}
                    </div>
                  )}

                  {scheduleResult && (
                    <div className="result-box" style={{ marginTop: '14px' }}>
                      <div style={{ color: '#276749', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>
                        Lab appointment booked
                      </div>
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#718096', fontSize: '12px' }}>View details</summary>
                        <pre style={{ marginTop: '6px' }}>{JSON.stringify(scheduleResult, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                  {scheduleError && <div className="error-box">{scheduleError}</div>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
