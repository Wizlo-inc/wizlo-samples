'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3048';

const NOTIFICATION_EVENTS = ['appointment', 'encounter'];

const CHANNEL_BADGE: Record<string, string> = {
  SMS: 'badge-blue',
  EMAIL: 'badge-purple',
};

interface WebhookEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  module: string;
  channel: string;
  payload: any;
}

export default function Page() {
  const [url, setUrl] = useState('');
  const [event, setEvent] = useState('appointment');
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

  const filtered = filter === 'all' ? events : events.filter(e => e.module === filter || e.eventType.toLowerCase().includes(filter));

  function getRecipient(ev: WebhookEvent) {
    const r = ev.payload?.recipient;
    if (!r) return '';
    return r.email || r.phone || '';
  }

  function getPatient(ev: WebhookEvent) {
    return ev.payload?.data?.patientName || '';
  }

  return (
    <div className="container">
      <h1>Notification Webhooks</h1>
      <p className="subtitle">
        Receives <code>notification.appointment</code> and <code>notification.encounter</code> events.
        Fires after every SMS or email notification sent by Wizlo.
      </p>

      <div className="card">
        <h2>Register This Server as a Webhook Receiver</h2>
        <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '16px' }}>
          Expose this backend using <strong>ngrok</strong>:{' '}
          <code>ngrok http 3048</code> — register each notification type separately.
        </p>
        <div className="form-group">
          <label>Public Webhook URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://xxxx.ngrok.io/webhook/receive" />
        </div>
        <div className="form-group">
          <label>Notification Type</label>
          <select value={event} onChange={e => setEvent(e.target.value)}>
            {NOTIFICATION_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
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
            Received Notifications{' '}
            <span style={{ color: '#718096', fontWeight: 400, fontSize: '0.875rem' }}>
              ({total} total · auto-refreshes every 3s)
            </span>
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={clearEvents}>Clear All</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`btn btn-sm ${filter === 'appointment' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('appointment')}>Appointment</button>
          <button className={`btn btn-sm ${filter === 'encounter' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('encounter')}>Encounter</button>
          <button className={`btn btn-sm ${filter === 'SMS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('SMS')}>SMS</button>
          <button className={`btn btn-sm ${filter === 'EMAIL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('EMAIL')}>Email</button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {total === 0 ? 'No notifications yet. Register this server and trigger an appointment or encounter event in Wizlo.' : 'No events match the selected filter.'}
          </div>
        ) : (
          filtered.map(ev => (
            <div key={ev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#f7fafc', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              >
                <span className={`badge ${CHANNEL_BADGE[ev.channel] || 'badge-yellow'}`}>{ev.channel}</span>
                <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>{ev.eventType}</span>
                <span style={{ fontSize: '0.8125rem', color: '#4a5568' }}>
                  {getPatient(ev)}{getPatient(ev) && getRecipient(ev) ? ' · ' : ''}{getRecipient(ev)}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#718096', whiteSpace: 'nowrap' }}>
                  {new Date(ev.receivedAt).toLocaleString()}
                </span>
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
