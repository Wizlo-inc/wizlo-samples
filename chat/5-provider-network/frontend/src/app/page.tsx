'use client';
import { useState } from 'react';
import {
  listProviderNetworkChats,
  getUnreadEncounters,
  type ProviderNetworkChatListResponse,
  type ProviderNetworkChatThread,
} from '@/lib/api';

export default function ProviderNetworkPage() {
  const [filters, setFilters] = useState({
    userEmail: '',
    status: '',
    type: '',
    search: '',
    hasUnread: false,
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ProviderNetworkChatListResponse | null>(null);
  const [unread, setUnread] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string | boolean) =>
    setFilters(prev => ({ ...prev, [field]: value }));

  const fetchPage = async (targetPage: number) => {
    if (!filters.userEmail.trim()) {
      setError('Provider-network user email is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listProviderNetworkChats({
        userEmail: filters.userEmail.trim(),
        status: filters.status || undefined,
        type: filters.type || undefined,
        search: filters.search || undefined,
        hasUnread: filters.hasUnread || undefined,
        page: targetPage,
        limit: 25,
      });
      setResult(data);
      setPage(targetPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUnread = async () => {
    if (!filters.userEmail.trim()) {
      setError('Provider-network user email is required.');
      return;
    }
    setError('');
    try {
      const data = await getUnreadEncounters(filters.userEmail.trim());
      setUnread(data.encounterIds);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fullName = (u?: { firstName: string; lastName: string }) =>
    u ? `${u.firstName} ${u.lastName}` : '—';
  const threads: ProviderNetworkChatThread[] = result?.data ?? [];

  return (
    <div className="container">
      <h1>Provider Network Chats</h1>
      <p className="subtitle">
        A <strong>provider-network</strong> tenant serves many clinics, so its chat views
        aggregate threads from every clinic it serves — each row is tagged with the owning clinic.
        This is the key difference from a clinic tenant, which only ever sees its own threads.
      </p>

      <div className="card">
        <span className="badge">GET /chats/provider-network/chats-list</span>

        <div className="form-group">
          <label>Provider-Network User Email *</label>
          <input
            type="email"
            value={filters.userEmail}
            onChange={e => set('userEmail', e.target.value)}
            placeholder="user@providernetwork.com"
          />
          <p className="hint">
            A staff user belonging to the provider-network tenant. The backend exchanges this for a
            user-scoped Wizlo token via <code>POST /oauth/user-token</code> — provider-network endpoints
            scope results to the JWT subject&apos;s network membership.
          </p>
        </div>

        <div className="form-row-3">
          <div className="form-group">
            <label>Status</label>
            <select value={filters.status} onChange={e => set('status', e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={filters.type} onChange={e => set('type', e.target.value)}>
              <option value="">All</option>
              <option value="medical">Medical</option>
              <option value="non_medical">Non-medical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Search</label>
            <input type="text" value={filters.search} onChange={e => set('search', e.target.value)} placeholder="Patient / order no." />
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input type="checkbox" id="hasUnread" checked={filters.hasUnread} onChange={e => set('hasUnread', e.target.checked)} />
            <label htmlFor="hasUnread">Only threads with unread messages</label>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => fetchPage(1)} disabled={loading || !filters.userEmail.trim()}>
            {loading ? 'Loading...' : 'Load Aggregated Chats'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </div>

      {result && (
        <div className="card">
          {threads.length === 0 ? (
            <div className="empty-state">No threads match these filters across the network.</div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Clinic (tenant)</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Order</th>
                    <th>Last message</th>
                    <th>Unread</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map(t => (
                    <tr key={`${t.tenantId}-${t.id}`}>
                      <td><strong>{t.tenant?.name || t.tenantId}</strong><br /><span className="muted">{t.tenant?.subdomain}</span></td>
                      <td>{fullName(t.subjectUser)}</td>
                      <td><span className={`pill pill-${t.status}`}>{t.status}</span></td>
                      <td>{t.type ? <span className={`pill pill-${t.type}`}>{t.type}</span> : <span className="muted">—</span>}</td>
                      <td>{t.orderNo || <span className="muted">—</span>}</td>
                      <td>{t.lastMessage ? `${t.lastMessage.slice(0, 36)}${t.lastMessage.length > 36 ? '…' : ''}` : <span className="muted">—</span>}</td>
                      <td>{t.unreadCount > 0 ? <span className="pill pill-unread">{t.unreadCount}</span> : <span className="muted">0</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="toolbar">
                <span className="page-info">
                  Page {result.pagination.page} of {result.pagination.totalPages} · {result.pagination.total} total
                </span>
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={() => fetchPage(page - 1)} disabled={loading || !result.pagination.hasPrev}>Prev</button>
                  <button className="btn btn-primary" onClick={() => fetchPage(page + 1)} disabled={loading || !result.pagination.hasNext}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="card">
        <span className="badge">GET /chats-v2/provider-network/encounter-unread-counts</span>
        <p className="hint" style={{ marginBottom: 14 }}>
          Encounter IDs (across all served clinics) that currently have unread patient messages —
          used to drive per-encounter unread indicators. Uses the same user email entered above.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={loadUnread} disabled={loading || !filters.userEmail.trim()}>
            Load Unread Encounters
          </button>
        </div>
        {unread && (
          <div className="result-box" style={{ marginTop: 16 }}>
            {unread.length === 0 ? (
              <span className="muted">No encounters with unread messages.</span>
            ) : (
              <span>{unread.length} encounter(s): <code>{unread.join(', ')}</code></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
