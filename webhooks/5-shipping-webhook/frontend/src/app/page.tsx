'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3044';

interface WebhookEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  payload: any;
}

export default function Page() {
  const [url, setUrl] = useState('');
  const [event, setEvent] = useState('updated');
  const [secret, setSecret] = useState('');
  const [regResult, setRegResult] = useState<any>(null);
  const [regError, setRegError] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <div className="container">
      <h1>Shipping Webhook</h1>
      <p className="subtitle">
        Receives <code>shipping.created</code> and <code>shipping.updated</code> events.
        Notifies of shipment status, carrier, and tracking changes in real time.
      </p>

      <div className="card">
        <h2>Register This Server as a Webhook Receiver</h2>
        <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '16px' }}>
          Expose this backend publicly using <strong>ngrok</strong>:{' '}
          <code>ngrok http 3044</code> — then paste the generated URL below.
        </p>
        <div className="form-group">
          <label>Public Webhook URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://xxxx.ngrok.io/webhook/receive" />
        </div>
        <div className="form-group">
          <label>Event</label>
          <select value={event} onChange={e => setEvent(e.target.value)}>
            <option value="created">created</option>
            <option value="updated">updated</option>
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

        {events.length === 0 ? (
          <div className="empty-state">
            No events yet. Register this server and create/update a shipment in Wizlo.
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#f7fafc', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              >
                <span className={`badge ${ev.eventType === 'created' ? 'badge-active' : 'badge-blue'}`}>{ev.eventType}</span>
                {ev.payload?.shipment && (
                  <span style={{ fontSize: '0.8125rem', color: '#4a5568' }}>
                    {ev.payload.shipment.shipping_no} · {ev.payload.shipment.shipping_status}
                    {ev.payload.tracking_details?.carrier_name ? ` · ${ev.payload.tracking_details.carrier_name}` : ''}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#718096' }}>
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
