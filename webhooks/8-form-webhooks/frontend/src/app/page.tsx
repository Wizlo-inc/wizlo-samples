'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3047';

const FORM_EVENTS = [
  'session_started', 'progress_saved', 'completed',
  'product_selected', 'coupon_used', 'disqualified', 'abandoned',
  'encounter_completed',
];

const EVENT_BADGE: Record<string, string> = {
  session_started: 'badge-blue',
  progress_saved: 'badge-yellow',
  completed: 'badge-active',
  product_selected: 'badge-purple',
  coupon_used: 'badge-orange',
  disqualified: 'badge-red',
  abandoned: 'badge-red',
  encounter_completed: 'badge-active',
  unknown: 'badge-yellow',
};

interface WebhookEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  payload: any;
}

export default function Page() {
  const [url, setUrl] = useState('');
  const [event, setEvent] = useState('session_started');
  const [secret, setSecret] = useState('');
  const [regResult, setRegResult] = useState<any>(null);
  const [regError, setRegError] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/webhook/events`);
      const data = await res.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchEvents();
    const t = setInterval(fetchEvents, 3000);
    return () => clearInterval(t);
  }, [fetchEvents]);

  async function register() {
    setRegError(''); setRegResult(null); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/webhook/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, event, secret: secret || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setRegResult(data);
    } catch (e: any) { setRegError(e.message); }
    finally { setLoading(false); }
  }

  async function clearEvents() {
    await fetch(`${API_URL}/webhook/events`, { method: 'DELETE' });
    setEvents([]); setTotal(0);
  }

  const filtered = filter === 'all' ? events : events.filter(e => e.eventType === filter);

  function getSummary(ev: WebhookEvent) {
    const parts: string[] = [];
    if (ev.eventType === 'encounter_completed') {
      const p = ev.payload || {};
      if (p.form_name) parts.push(p.form_name);
      if (p.encounter_id) parts.push(`encounter: ${p.encounter_id}`);
      if (p.patient_id) parts.push(`patient: ${p.patient_id.slice(0, 8)}…`);
      if (p.external_order_identifier) parts.push(`ext: ${p.external_order_identifier}`);
    } else {
      const d = ev.payload?.data || {};
      if (d.form_name) parts.push(d.form_name);
      if (d.session_id) parts.push(`session: ${d.session_id.slice(0, 8)}…`);
      if (d.current_page && d.total_pages) parts.push(`page ${d.current_page}/${d.total_pages}`);
      if (d.completion_percentage !== undefined) parts.push(`${d.completion_percentage}%`);
      if (d.patient_email) parts.push(d.patient_email);
      if (d.coupon_code) parts.push(`coupon: ${d.coupon_code}`);
      if (d.reason) parts.push(`reason: ${d.reason}`);
      if (d.product?.productName) parts.push(d.product.productName);
    }
    return parts.join(' · ');
  }

  return (
    <div className="container">
      <h1>Form Lead Generation Webhooks</h1>
      <p className="subtitle">
        Receives <code>forms.*</code> events tracking the full lead lifecycle.
        Each webhook config subscribes to a single event — create separate configs per event type.
      </p>

      <div className="card">
        <h2>Register This Server as a Webhook Receiver</h2>
        <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '16px' }}>
          Expose this backend using <strong>ngrok</strong>:{' '}
          <code>ngrok http 3047</code> — register each event type separately.
        </p>
        <div className="form-group">
          <label>Public Webhook URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://xxxx.ngrok.io/webhook/receive" />
        </div>
        <div className="form-group">
          <label>Event Type</label>
          <select value={event} onChange={e => setEvent(e.target.value)}>
            {FORM_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Signing Secret (optional)</label>
          <input type="text" value={secret} onChange={e => setSecret(e.target.value)}
            placeholder="Leave blank to skip signature verification" />
        </div>
        <button className="btn btn-primary" onClick={register} disabled={!url || loading}>
          {loading ? 'Registering…' : 'Register Webhook'}
        </button>
        {regError && <div className="error-box">{regError}</div>}
        {regResult && <div className="result-box"><pre>{JSON.stringify(regResult, null, 2)}</pre></div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>
            Received Events{' '}
            <span style={{ color: '#718096', fontWeight: 400, fontSize: '0.875rem' }}>
              ({total} total · auto-refreshes every 3s)
            </span>
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={clearEvents}>Clear All</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
          {FORM_EVENTS.map(ev => (
            <button key={ev} className={`btn btn-sm ${filter === ev ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(ev)}>{ev}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {total === 0 ? 'No events yet. Register this server and submit/interact with a Wizlo form.' : `No "${filter}" events received.`}
          </div>
        ) : (
          filtered.map(ev => (
            <div key={ev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#f7fafc', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              >
                <span className={`badge ${EVENT_BADGE[ev.eventType] || 'badge-yellow'}`}>{ev.eventType}</span>
                <span style={{ fontSize: '0.8125rem', color: '#4a5568', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSummary(ev)}</span>
                <span style={{ fontSize: '0.8125rem', color: '#718096', whiteSpace: 'nowrap' }}>{new Date(ev.receivedAt).toLocaleString()}</span>
                <span style={{ color: '#a0aec0', fontSize: '0.75rem' }}>{expandedId === ev.id ? '▲' : '▼'}</span>
              </div>
              {expandedId === ev.id && (
                <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                  <pre style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
