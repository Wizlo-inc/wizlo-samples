'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getMessages,
  sendMessage,
  type ThreadMessage,
  type ThreadMessagesResponse,
} from '@/lib/api';

const POLL_MS = 4000;

export default function MessagingPage() {
  const [patientEmail, setPatientEmail] = useState('');
  const [encounterId, setEncounterId] = useState('');
  const [loadedEncounter, setLoadedEncounter] = useState('');
  const [loadedEmail, setLoadedEmail] = useState('');
  const [thread, setThread] = useState<ThreadMessagesResponse['thread'] | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (id: string, email: string) => {
    const data = await getMessages(id, email);
    setThread(data.thread);
    setMessages(data.messages);
  }, []);

  const load = async () => {
    const id = encounterId.trim();
    const email = patientEmail.trim();
    if (!id || !email) return;
    setLoading(true);
    setError('');
    try {
      await refresh(id, email);
      setLoadedEncounter(id);
      setLoadedEmail(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoadedEncounter('');
      setLoadedEmail('');
      setThread(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new messages (e.g. provider replies) while a thread is open.
  // In production prefer the Kafka stream (see ../4-realtime-kafka); polling is
  // shown here because it needs no extra infrastructure.
  useEffect(() => {
    if (!loadedEncounter || !loadedEmail) return;
    const timer = setInterval(() => {
      refresh(loadedEncounter, loadedEmail).catch(() => {/* keep last good state */});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [loadedEncounter, loadedEmail, refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !loadedEncounter || !loadedEmail) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(loadedEncounter, text, loadedEmail);
      setDraft('');
      await refresh(loadedEncounter, loadedEmail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  return (
    <div className="container">
      <h1>Chat Messaging</h1>
      <p className="subtitle">
        Load a thread&apos;s message history by encounter ID, send messages as the patient,
        and watch provider replies arrive via polling.
      </p>

      <div className="card">
        <span className="badge">GET /chats-v2/:encounterId/messages · POST .../messages/patient</span>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Patient Email *</label>
            <input
              type="email"
              value={patientEmail}
              onChange={e => setPatientEmail(e.target.value)}
              placeholder="patient@example.com"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Encounter ID *</label>
            <input
              type="text"
              value={encounterId}
              onChange={e => setEncounterId(e.target.value)}
              placeholder="EA00000077"
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={load}
              disabled={loading || !encounterId.trim() || !patientEmail.trim()}
            >
              {loading ? 'Loading...' : 'Load Thread'}
            </button>
          </div>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          Both endpoints are patient-scoped. The backend mints a user-scoped Wizlo token from{' '}
          <code>patientEmail</code> via <code>POST /oauth/user-token</code> before calling Wizlo.
        </p>
        {error && <div className="error-box">{error}</div>}
      </div>

      {loadedEncounter && (
        <div className="card">
          {thread && (
            <p className="hint" style={{ marginBottom: 14 }}>
              Thread <code>{thread.id}</code> · status{' '}
              <span className={`pill pill-${thread.status}`}>{thread.status}</span>{' '}
              · auto-refreshing every {POLL_MS / 1000}s
            </p>
          )}
          <div className="chat-window">
            <div className="chat-messages" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="empty-state">No messages yet — say hello below.</div>
              ) : (
                messages.map(m => (
                  <div
                    key={m.messageId}
                    className={`bubble ${m.sender.isPatient ? 'bubble-patient' : 'bubble-staff'}`}
                  >
                    {m.content}
                    <div className="meta">
                      {m.sender.fullName || (m.sender.isPatient ? 'Patient' : 'Staff')} · {fmt(m.sentAt)} · {m.deliveryStatus}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="chat-composer">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Type a message as the patient..."
                onKeyDown={e => e.key === 'Enter' && send()}
              />
              <button className="btn btn-success" onClick={send} disabled={sending || !draft.trim()}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
