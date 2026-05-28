'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getUserToken } from '@/lib/api';

// The widget touches browser-only APIs and its own store, so load it client-side only.
const ChatPanel = dynamic(() => import('@/components/ChatPanel'), {
  ssr: false,
  loading: () => <p className="hint">Loading chat widget…</p>,
});

export default function ChatWidgetPage() {
  const [form, setForm] = useState({
    email: '',
    orderNo: '',
    primaryColor: '#4299e1',
    secondaryColor: '#6c757d',
    showMenu: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<{ authToken: string; baseUrl: string } | null>(null);

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const { accessToken, baseUrl } = await getUserToken(form.email.trim());
      setSession({ authToken: accessToken, baseUrl });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.email.trim() && form.orderNo.trim();

  return (
    <div className="container">
      <h1>Drop-in Chat Widget</h1>
      <p className="subtitle">
        Mount Wizlo&apos;s prebuilt <code>@wizlo/chat-widget</code> — no chat UI to build.
        Your backend mints a user token; the widget handles threads, messaging, and the
        real-time ACS connection itself.
      </p>

      <div className="card">
        <span className="badge">POST /auth/token → /oauth/user-token</span>

        {!session ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Patient Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@example.com" />
                <p className="hint">Sent to your backend; secrets stay server-side.</p>
              </div>
              <div className="form-group">
                <label>Order Number *</label>
                <input type="text" value={form.orderNo} onChange={e => set('orderNo', e.target.value)} placeholder="ORD-12345" />
                <p className="hint">The widget opens the thread for this order.</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Primary Color</label>
                <input type="text" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#4299e1" />
              </div>
              <div className="form-group">
                <label>Secondary Color</label>
                <input type="text" value={form.secondaryColor} onChange={e => set('secondaryColor', e.target.value)} placeholder="#6c757d" />
              </div>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input type="checkbox" id="showMenu" checked={form.showMenu} onChange={e => set('showMenu', e.target.checked)} />
                <label htmlFor="showMenu">Show dropdown menu</label>
              </div>
            </div>

            <div className="btn-row">
              <button className="btn btn-success" onClick={start} disabled={loading || !isValid}>
                {loading ? 'Authenticating...' : 'Start Chat'}
              </button>
            </div>
            {error && <div className="error-box">{error}</div>}
          </>
        ) : (
          <>
            <div className="btn-row" style={{ marginBottom: 16 }}>
              <button className="btn btn-danger" onClick={() => setSession(null)}>← Back to configuration</button>
            </div>
            <ChatPanel
              baseUrl={session.baseUrl}
              authToken={session.authToken}
              orderNo={form.orderNo.trim()}
              primaryColor={form.primaryColor}
              secondaryColor={form.secondaryColor}
              showMenu={form.showMenu}
            />
          </>
        )}
      </div>
    </div>
  );
}
