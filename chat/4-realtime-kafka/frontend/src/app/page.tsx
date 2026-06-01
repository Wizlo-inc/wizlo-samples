'use client';
import { useEffect, useState } from 'react';
import { getEvents, clearEvents, type EventsResponse } from '@/lib/api';

const POLL_MS = 3000;

export default function RealtimeKafkaPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      setData(await getEvents());
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    }
  };

  // The backend holds the long-lived Kafka connection; this page just polls the
  // backend's in-memory buffer so you can watch events arrive in the browser.
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const onClear = async () => {
    await clearEvents();
    refresh();
  };

  const fmt = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleTimeString();
  };

  return (
    <div className="container">
      <h1>Real-time Chat via Kafka</h1>
      <p className="subtitle">
        The backend runs a Kafka consumer subscribed to your tenant topic. Each time a
        provider replies in the Wizlo portal, a <code>chat-message</code> event lands here.
      </p>

      <div className="card">
        <span className="badge">Kafka consumer · x-message-type: chat-message</span>
        <div className="toolbar" style={{ marginTop: 0 }}>
          <span className="page-info">
            {data?.connected ? (
              <>🟢 Connected to <code>{data.topic}</code> as <code>{data.consumerGroup}</code></>
            ) : (
              <>🔴 Not connected — set <code>KAFKA_*</code> in the backend <code>.env</code></>
            )}
          </span>
          <button className="btn btn-danger" onClick={onClear} disabled={!data || data.total === 0}>
            Clear
          </button>
        </div>
        {error && <div className="error-box">{error}</div>}
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          Received Events {data ? `(${data.total})` : ''}
        </div>
        {!data || data.events.length === 0 ? (
          <div className="empty-state">
            Waiting for events… send a provider reply from the Wizlo portal to see one appear.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Sender</th>
                <th>Message</th>
                <th>Key</th>
                <th>Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e, i) => (
                <tr key={`${e.offset}-${i}`}>
                  <td>{fmt(e.receivedAt)}</td>
                  <td>
                    {e.payload.sender?.displayName || '—'}
                    {e.payload.sender && (
                      <span className={`pill pill-${e.payload.sender.isPatient ? 'medical' : 'non_medical'}`} style={{ marginLeft: 6 }}>
                        {e.payload.sender.isPatient ? 'patient' : 'staff'}
                      </span>
                    )}
                  </td>
                  <td>{e.payload.content || <span className="muted">—</span>}</td>
                  <td><code>{e.key || '—'}</code></td>
                  <td>{fmt(e.payload.sentAt)}</td>
                  <td>{e.payload.deliveryStatus || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
