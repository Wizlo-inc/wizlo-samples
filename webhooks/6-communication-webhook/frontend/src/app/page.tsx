'use client';
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3045';

interface WebhookEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  payload: any;
}

export default function Page() {
  const [url, setUrl] = useState('');
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
        body: JSON.stringify({ url, secret: secret || undefined }),
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
      <h1>Communication Message Webhook</h1>
      <p className="subtitle">
        Receives <code>chats.message_sent</code> events. Triggered whenever a communication message is
        sent to a thread. Includes message content, sender name, and associated order number.
      </p>

      <div className="card">
        <h2>Register This Server as a Webhook Receiver</h2>
        <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '16px' }}>
          Expose this backend using <strong>ngrok</strong>:{' '}
          <code>ngrok http 3045</code> — then paste the generated URL below.
        </p>
        <div className="form-group">
          <label>Public Webhook URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://xxxx.ngrok.io/webhook/receive" />
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
            Received Messages{' '}
            <span style={{ color: '#718096', fontWeight: 400, fontSize: '0.875rem' }}>
              ({total} total · auto-refreshes every 3s)
            </span>
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={clearEvents}>Clear All</button>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            No messages yet. Register this server and send a chat message in Wizlo.
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f7fafc', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              >
                <span className="badge badge-purple">message_sent</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#2d3748' }}>
                    {ev.payload.senderDisplayName || 'Unknown'}
                  </span>
                  {ev.payload.orderNo && (
                    <span style={{ fontSize: '0.8125rem', color: '#718096', marginLeft: '8px' }}>
                      Order: {ev.payload.orderNo}
                    </span>
                  )}
                  <p style={{ fontSize: '0.8125rem', color: '#4a5568', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.payload.message}
                  </p>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#718096', whiteSpace: 'nowrap' }}>
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
