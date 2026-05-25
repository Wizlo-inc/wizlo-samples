'use client';
import { useState, useEffect, useCallback } from 'react';
import { createWebhook, listWebhooks, updateWebhook, deleteWebhook } from '@/lib/api';

interface WebhookConfig {
  id: string;
  name?: string;
  module: string;
  event: string;
  url: string;
  isActive: boolean;
  maxRetries?: number;
  isSigningRequired?: boolean;
  createdAt: string;
}

const MODULES = ['encounters', 'orders', 'products', 'shipping', 'chats', 'rx', 'forms', 'notification'];
const EVENTS: Record<string, string[]> = {
  encounters: ['updated'],
  orders: ['updated'],
  products: ['updated'],
  shipping: ['created', 'updated'],
  chats: ['message_sent'],
  rx: ['honeybee_received'],
  forms: ['session_started', 'progress_saved', 'completed', 'product_selected', 'coupon_used', 'disqualified', 'abandoned'],
  notification: ['appointment', 'encounter'],
};

export default function Page() {
  const [form, setForm] = useState({
    url: '', module: 'encounters', event: 'updated', name: '',
    customHeaders: '', maxRetries: '3',
    isSigningRequired: false, secret: '', algorithm: 'hmac-sha256', headerKey: 'X-Webhook-Signature',
  });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);
  const [createError, setCreateError] = useState('');

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [editId, setEditId] = useState('');
  const [editForm, setEditForm] = useState({ name: '', url: '', isActive: true, maxRetries: '3' });
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [updateError, setUpdateError] = useState('');

  const loadWebhooks = useCallback(async () => {
    setLoadingList(true);
    try {
      const data: any = await listWebhooks();
      const list = data?.data ?? data ?? [];
      setWebhooks(Array.isArray(list) ? list : []);
    } catch {
      setWebhooks([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadWebhooks(); }, [loadWebhooks]);

  const availableEvents = EVENTS[form.module] || [];

  async function handleCreate() {
    setCreating(true); setCreateError(''); setCreateResult(null);
    try {
      const payload: any = { url: form.url, module: form.module, event: form.event };
      if (form.name) payload.name = form.name;
      if (form.maxRetries) payload.maxRetries = Number(form.maxRetries);
      if (form.customHeaders.trim()) {
        try { payload.customHeaders = JSON.parse(form.customHeaders); } catch { throw new Error('Invalid JSON in Custom Headers'); }
      }
      if (form.isSigningRequired) {
        payload.isSigningRequired = true;
        payload.signingConfig = { secret: form.secret, algorithm: form.algorithm, headerKey: form.headerKey };
      }
      const result = await createWebhook(payload);
      setCreateResult(result);
      loadWebhooks();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  }

  function startEdit(wh: WebhookConfig) {
    setEditId(wh.id);
    setEditForm({ name: wh.name || '', url: wh.url, isActive: wh.isActive, maxRetries: String(wh.maxRetries || 3) });
    setUpdateResult(null); setUpdateError('');
  }

  async function handleUpdate() {
    if (!editId) return;
    setUpdating(true); setUpdateError(''); setUpdateResult(null);
    try {
      const payload: any = { isActive: editForm.isActive };
      if (editForm.name) payload.name = editForm.name;
      if (editForm.url) payload.url = editForm.url;
      if (editForm.maxRetries) payload.maxRetries = Number(editForm.maxRetries);
      const result = await updateWebhook(editId, payload);
      setUpdateResult(result);
      loadWebhooks();
    } catch (e: any) { setUpdateError(e.message); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook?')) return;
    try { await deleteWebhook(id); loadWebhooks(); } catch {}
  }

  return (
    <div className="container">
      <h1>Manage Webhooks</h1>
      <p className="subtitle">Create and update webhook configurations via the Wizlo API (POST /tenant/webhooks, PATCH /tenant/webhooks/:id).</p>

      <div className="two-col">
        <div className="col-form">
          <div className="card">
            <h2>Create Webhook</h2>
            <div className="form-group">
              <label>Destination URL *</label>
              <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-server.com/webhook/receive" />
            </div>
            <div className="row">
              <div className="form-group">
                <label>Module *</label>
                <select value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value, event: EVENTS[e.target.value]?.[0] || '' }))}>
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Event *</label>
                <select value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}>
                  {availableEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Name (optional)</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Webhook" />
            </div>
            <div className="form-group">
              <label>Max Retries (1–10)</label>
              <input type="number" value={form.maxRetries} onChange={e => setForm(f => ({ ...f, maxRetries: e.target.value }))} min={1} max={10} />
            </div>
            <div className="form-group">
              <label>Custom Headers (JSON, optional)</label>
              <textarea value={form.customHeaders} onChange={e => setForm(f => ({ ...f, customHeaders: e.target.value }))} placeholder={'{"x-api-key": "your-secret"}'} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isSigningRequired} onChange={e => setForm(f => ({ ...f, isSigningRequired: e.target.checked }))} />
                Enable HMAC Payload Signing
              </label>
            </div>
            {form.isSigningRequired && (
              <>
                <div className="form-group">
                  <label>Signing Secret</label>
                  <input type="text" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="my-secret-key" />
                </div>
                <div className="row">
                  <div className="form-group">
                    <label>Algorithm</label>
                    <input type="text" value={form.algorithm} onChange={e => setForm(f => ({ ...f, algorithm: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Header Key</label>
                    <input type="text" value={form.headerKey} onChange={e => setForm(f => ({ ...f, headerKey: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            <button className="btn btn-primary" onClick={handleCreate} disabled={!form.url || !form.module || !form.event || creating}>
              {creating ? 'Creating…' : 'Create Webhook'}
            </button>
            {createError && <div className="error-box">{createError}</div>}
            {createResult && <div className="result-box"><pre>{JSON.stringify(createResult, null, 2)}</pre></div>}
          </div>

          {editId && (
            <div className="card">
              <h2>Update Webhook</h2>
              <p className="hint" style={{ marginBottom: '16px' }}>Editing: <code>{editId}</code></p>
              <div className="form-group">
                <label>New Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>New URL</label>
                <input type="text" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Max Retries</label>
                <input type="number" value={editForm.maxRetries} onChange={e => setEditForm(f => ({ ...f, maxRetries: e.target.value }))} min={1} max={10} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
                  {updating ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditId(''); setUpdateResult(null); }}>Cancel</button>
              </div>
              {updateError && <div className="error-box">{updateError}</div>}
              {updateResult && <div className="result-box"><pre>{JSON.stringify(updateResult, null, 2)}</pre></div>}
            </div>
          )}
        </div>

        <div className="col-table">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Configured Webhooks</h2>
              <button className="btn btn-secondary btn-sm" onClick={loadWebhooks}>Refresh</button>
            </div>
            {loadingList ? (
              <div className="empty-state">Loading…</div>
            ) : webhooks.length === 0 ? (
              <div className="empty-state">No webhooks yet. Create one to get started.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Module · Event</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map(wh => (
                    <tr key={wh.id}>
                      <td>{wh.name || <span style={{ color: '#a0aec0' }}>—</span>}</td>
                      <td><code>{wh.module}.{wh.event}</code></td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</td>
                      <td><span className={`badge ${wh.isActive ? 'badge-active' : 'badge-inactive'}`}>{wh.isActive ? 'active' : 'paused'}</span></td>
                      <td>
                        <div className="action-group">
                          <button className="btn btn-sm btn-ghost" onClick={() => startEdit(wh)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(wh.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
