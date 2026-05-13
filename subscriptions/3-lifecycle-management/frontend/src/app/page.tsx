'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getStats, listSubscriptions, getTimeline,
  pauseSubscription, resumeSubscription, cancelSubscription,
  delaySubscription, resubscribeSubscription,
} from '@/lib/api';

const CANCEL_REASONS = [
  'I am experiencing too many side effects',
  'Completed the current treatment',
  'Too expensive',
  "Using another company's product",
  'Health or medical reasons',
  'Others',
];

type ActionType = 'pause' | 'resume' | 'cancel' | 'delay' | 'resubscribe' | null;
type TabType = 'actions' | 'timeline';

interface Subscription {
  id?: string;
  subscriptionId?: string;
  status?: string;
  patientName?: string;
  planName?: string;
  nextFulfillmentDate?: string;
  pausedUntilDate?: string;
  [key: string]: unknown;
}

interface Stats {
  total?: number;
  active?: number;
  paused?: number;
  cancelled?: number;
  passedDue?: number;
  [key: string]: unknown;
}

interface TimelineEvent {
  event?: string;
  description?: string;
  createdAt?: string;
  performedBy?: string;
  [key: string]: unknown;
}

const badgeClass = (s?: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'badge-active', PAUSED: 'badge-paused', CANCELLED: 'badge-cancelled',
    PENDING: 'badge-pending', PAYMENT_FAILED: 'badge-payment-failed',
    EXPIRED: 'badge-expired', REASSESSMENT_REQUIRED: 'badge-reassessment-required',
  };
  return `badge ${map[s ?? ''] ?? 'badge-cancelled'}`;
};

const canDo = (action: ActionType, status?: string): boolean => {
  if (!status) return false;
  const rules: Record<string, ActionType[]> = {
    ACTIVE: ['pause', 'cancel', 'delay'],
    PAUSED: ['resume', 'cancel'],
    CANCELLED: ['resubscribe'],
    PAYMENT_FAILED: ['cancel'],
    PENDING: ['cancel'],
  };
  return (rules[status] ?? []).includes(action);
};

export default function LifecyclePage() {
  // ── List & Stats ─────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // ── Selected row ─────────────────────────────────────────────
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('actions');

  // ── Timeline ─────────────────────────────────────────────────
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState('');

  // ── Action state ─────────────────────────────────────────────
  const [actionType, setActionType] = useState<ActionType>(null);
  const [pauseUntil, setPauseUntil] = useState('');
  const [newFulfillDate, setNewFulfillDate] = useState('');
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelDesc, setCancelDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionResult, setActionResult] = useState<unknown>(null);

  const fetchStats = useCallback(async () => {
    try { setStats(await getStats() as Stats); } catch { /* non-critical */ }
  }, []);

  const fetchList = useCallback(async () => {
    setListLoading(true); setListError('');
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const data = await listSubscriptions(params) as { data?: Subscription[] } | Subscription[];
      setSubscriptions(Array.isArray(data) ? data : ((data as { data?: Subscription[] }).data ?? []));
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to load subscriptions');
    } finally { setListLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { fetchList(); fetchStats(); }, [fetchList, fetchStats]);

  const selectSubscription = (sub: Subscription) => {
    setSelected(sub);
    setActionType(null);
    setActionResult(null);
    setActionError('');
    setActiveTab('actions');
    setTimeline([]);
  };

  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'timeline' && selected) {
      const id = String(selected.id ?? selected.subscriptionId ?? '');
      setTimelineLoading(true); setTimelineError('');
      try {
        const data = await getTimeline(id) as { timeline?: TimelineEvent[] } | TimelineEvent[];
        setTimeline(Array.isArray(data) ? data : ((data as { timeline?: TimelineEvent[] }).timeline ?? []));
      } catch (e: unknown) {
        setTimelineError(e instanceof Error ? e.message : 'Failed to load timeline');
      } finally { setTimelineLoading(false); }
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !actionType) return;
    const id = String(selected.id ?? selected.subscriptionId ?? '');
    setActionLoading(true); setActionError(''); setActionResult(null);
    try {
      let result: unknown;
      if (actionType === 'pause')        result = await pauseSubscription(id, pauseUntil || undefined);
      else if (actionType === 'resume')  result = await resumeSubscription(id);
      else if (actionType === 'cancel')  result = await cancelSubscription(id, cancelReason, cancelDesc || undefined);
      else if (actionType === 'delay')   result = await delaySubscription(id, newFulfillDate);
      else if (actionType === 'resubscribe') result = await resubscribeSubscription(id);
      setActionResult(result);
      fetchList(); fetchStats();
      // Update selected row status from result
      const r = result as { subscription?: { status?: string }; status?: string };
      const newStatus = r?.subscription?.status ?? r?.status;
      if (newStatus) setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionLoading(false); }
  };

  const actionLabels: Record<string, string> = {
    pause: 'Pause', resume: 'Resume', cancel: 'Cancel', delay: 'Delay', resubscribe: 'Resubscribe',
  };

  return (
    <div className="container">
      <h1>Subscription Lifecycle Management</h1>
      <p className="subtitle">
        Pause, resume, delay, cancel, and resubscribe via <code>PATCH /tenants/client-subscriptions/:id/&lt;action&gt;</code>.
      </p>

      {/* Stats */}
      <div className="stats-bar">
        {[
          { key: 'total',    label: 'Total',    cls: 'total' },
          { key: 'active',   label: 'Active',   cls: 'active' },
          { key: 'paused',   label: 'Paused',   cls: 'paused' },
          { key: 'cancelled',label: 'Cancelled',cls: 'cancelled' },
          { key: 'passedDue',label: 'Past Due', cls: 'failed' },
        ].map(({ key, label, cls }) => (
          <div key={key} className={`stat-card ${cls}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{stats ? (stats[key] ?? '0') : '—'}</div>
          </div>
        ))}
      </div>

      <div className="layout">
        {/* ── Subscription List ── */}
        <div className="list-panel">
          <div className="card">
            <h2>Subscriptions</h2>
            <div className="row" style={{ marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  {['ACTIVE','PAUSED','CANCELLED','PENDING','PAYMENT_FAILED','EXPIRED'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID…" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { fetchList(); fetchStats(); }} disabled={listLoading}>
                  {listLoading ? '…' : 'Refresh'}
                </button>
              </div>
            </div>

            {listError && <div className="error-box">{listError}</div>}

            {!listLoading && !listError && (
              subscriptions.length === 0
                ? <p className="empty-state">No subscriptions found.</p>
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Sub ID</th>
                          <th>Patient</th>
                          <th>Plan</th>
                          <th>Next Fulfillment</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub, i) => {
                          const id = String(sub.subscriptionId ?? sub.id ?? i);
                          const isSelected = selected && (selected.subscriptionId ?? selected.id) === (sub.subscriptionId ?? sub.id);
                          return (
                            <tr key={id} className={`clickable ${isSelected ? 'selected' : ''}`} onClick={() => selectSubscription(sub)}>
                              <td className="mono">{sub.subscriptionId ?? sub.id ?? '—'}</td>
                              <td>{String(sub.patientName ?? sub.patientId ?? '—')}</td>
                              <td>{String(sub.planName ?? sub.subscriptionPlanName ?? '—')}</td>
                              <td>{sub.nextFulfillmentDate ? new Date(String(sub.nextFulfillmentDate)).toLocaleDateString() : '—'}</td>
                              <td><span className={badgeClass(sub.status)}>{sub.status ?? '—'}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
            )}
            {listLoading && <p className="empty-state">Loading…</p>}
          </div>
        </div>

        {/* ── Action Panel ── */}
        <div className="action-panel">
          {!selected ? (
            <div className="card">
              <p style={{ color: '#a0aec0', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>
                ← Select a subscription to manage it
              </p>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ marginBottom: '4px' }}>{String(selected.planName ?? selected.subscriptionPlanName ?? 'Subscription')}</h2>
              <p style={{ fontSize: '0.8125rem', color: '#718096', marginBottom: '12px' }}>
                <span className="mono">{selected.subscriptionId ?? selected.id}</span>
              </p>
              <span className={badgeClass(selected.status)} style={{ marginBottom: '16px', display: 'inline-block' }}>
                {selected.status}
              </span>

              <div className="tabs" style={{ marginTop: '16px' }}>
                <button className={`tab ${activeTab === 'actions' ? 'active' : ''}`} onClick={() => handleTabChange('actions')}>Actions</button>
                <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => handleTabChange('timeline')}>Timeline</button>
              </div>

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <>
                  <div className="action-buttons">
                    {(['pause','resume','delay','cancel','resubscribe'] as ActionType[]).map(a => {
                      const enabled = canDo(a, selected.status);
                      const btnClass = a === 'cancel' ? 'btn-danger' : a === 'resume' ? 'btn-success' : a === 'pause' ? 'btn-warning' : 'btn-primary';
                      return (
                        <button key={a!} className={`btn btn-sm ${enabled ? btnClass : 'btn-ghost'}`}
                          disabled={!enabled} onClick={() => { setActionType(a); setActionResult(null); setActionError(''); }}>
                          {actionLabels[a!]}
                        </button>
                      );
                    })}
                  </div>

                  {actionType && (
                    <form onSubmit={handleAction}>
                      <h3 style={{ marginBottom: '12px' }}>{actionLabels[actionType]}</h3>

                      {actionType === 'pause' && (
                        <div className="form-group">
                          <label>Resume automatically on</label>
                          <input type="date" value={pauseUntil} onChange={e => setPauseUntil(e.target.value)} />
                          <span className="hint">Leave blank for indefinite pause</span>
                        </div>
                      )}

                      {actionType === 'delay' && (
                        <div className="form-group">
                          <label>New Fulfillment Date *</label>
                          <input type="date" value={newFulfillDate} onChange={e => setNewFulfillDate(e.target.value)} required />
                        </div>
                      )}

                      {actionType === 'cancel' && (
                        <>
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
                        </>
                      )}

                      {(actionType === 'resume' || actionType === 'resubscribe') && (
                        <p style={{ fontSize: '0.875rem', color: '#4a5568', marginBottom: '14px' }}>
                          {actionType === 'resume'
                            ? 'Resume this paused subscription immediately.'
                            : 'Re-enroll this cancelled subscription. It will return to PENDING status.'}
                        </p>
                      )}

                      <button type="submit" className={`btn btn-sm ${actionType === 'cancel' ? 'btn-danger' : 'btn-primary'}`} disabled={actionLoading}>
                        {actionLoading ? 'Processing…' : `Confirm ${actionLabels[actionType]}`}
                      </button>
                    </form>
                  )}

                  {actionResult && (
                    <div className="result-box">
                      <div style={{ color: '#276749', fontWeight: 600, marginBottom: '6px', fontSize: '0.875rem' }}>
                        {actionType && actionLabels[actionType]} applied
                      </div>
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Raw response</summary>
                        <pre style={{ marginTop: '6px' }}>{JSON.stringify(actionResult, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                  {actionError && <div className="error-box">{actionError}</div>}
                </>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                timelineLoading ? <p className="empty-state">Loading timeline…</p> :
                timelineError ? <div className="error-box">{timelineError}</div> :
                timeline.length === 0 ? <p className="empty-state">No timeline events found.</p> : (
                  <ul className="timeline">
                    {timeline.map((event, i) => (
                      <li key={i} className="timeline-item">
                        <div className="timeline-event">{event.event ?? event.action ?? 'Event'}</div>
                        {event.description && <div className="timeline-desc">{event.description}</div>}
                        {event.performedBy && <div className="timeline-desc">By: {String(event.performedBy)}</div>}
                        <div className="timeline-time">
                          {event.createdAt ? new Date(String(event.createdAt)).toLocaleString() : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
