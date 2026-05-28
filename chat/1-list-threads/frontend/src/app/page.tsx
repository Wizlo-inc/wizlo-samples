'use client';
import { useState } from 'react';
import { listThreads, type ChatThread, type ChatListResponse } from '@/lib/api';

export default function ListThreadsPage() {
  const [filters, setFilters] = useState({
    userEmail: '',
    status: '',
    type: '',
    encounterId: '',
    search: '',
    hasUnread: false,
    sortBy: 'lastMessageSentAt',
    sortOrder: 'desc',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [result, setResult] = useState<ChatListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string | boolean) =>
    setFilters(prev => ({ ...prev, [field]: value }));

  const fetchPage = async (targetPage: number) => {
    if (!filters.userEmail.trim()) {
      setError('Staff email is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listThreads({
        userEmail: filters.userEmail.trim(),
        status: filters.status || undefined,
        type: filters.type || undefined,
        encounterId: filters.encounterId || undefined,
        search: filters.search || undefined,
        hasUnread: filters.hasUnread || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: targetPage,
        limit,
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

  const fullName = (u?: { firstName: string; lastName: string }) =>
    u ? `${u.firstName} ${u.lastName}` : '—';

  const threads: ChatThread[] = result?.data ?? [];

  return (
    <div className="container">
      <h1>List Chat Threads</h1>
      <p className="subtitle">
        Fetch a paginated, filterable list of chat threads for a clinic staff user via the Wizlo Chat API.
      </p>

      <div className="card">
        <span className="badge">GET /chats-v2</span>

        <div className="form-group">
          <label>Staff Email *</label>
          <input
            type="email"
            value={filters.userEmail}
            onChange={e => set('userEmail', e.target.value)}
            placeholder="staff@clinic.com"
          />
          <p className="hint">
            The clinic user whose chat queue you want to view. The backend exchanges this for a user-scoped
            Wizlo token via <code>POST /oauth/user-token</code> — without it, Wizlo filters by the M2M client
            identity (no chat membership) and returns an empty list.
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
            <label>Encounter ID</label>
            <input type="text" value={filters.encounterId} onChange={e => set('encounterId', e.target.value)} placeholder="EA00000077" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Search</label>
            <input type="text" value={filters.search} onChange={e => set('search', e.target.value)} placeholder="Patient name, email, or order no." />
          </div>
          <div className="form-group">
            <label>Sort</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={filters.sortBy} onChange={e => set('sortBy', e.target.value)}>
                <option value="lastMessageSentAt">Last message</option>
                <option value="createdAt">Created</option>
                <option value="patientName">Patient name</option>
                <option value="status">Status</option>
              </select>
              <select value={filters.sortOrder} onChange={e => set('sortOrder', e.target.value)} style={{ width: '110px' }}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
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
            {loading ? 'Loading...' : 'Search Threads'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </div>

      {result && (
        <div className="card">
          {threads.length === 0 ? (
            <div className="empty-state">No threads match these filters.</div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Encounter</th>
                    <th>Order</th>
                    <th>Last message</th>
                    <th>Assignee</th>
                    <th>Unread</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map(t => (
                    <tr key={t.id}>
                      <td>{fullName(t.subjectUser)}</td>
                      <td><span className={`pill pill-${t.status}`}>{t.status}</span></td>
                      <td>{t.type ? <span className={`pill pill-${t.type}`}>{t.type}</span> : <span className="muted">—</span>}</td>
                      <td>{t.encounterId || <span className="muted">—</span>}</td>
                      <td>{t.orderNo || <span className="muted">—</span>}</td>
                      <td>{t.lastMessage ? <span title={t.lastMessage}>{t.lastMessage.slice(0, 40)}{t.lastMessage.length > 40 ? '…' : ''}</span> : <span className="muted">—</span>}</td>
                      <td>{fullName(t.assignedTo)}</td>
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
                  <button className="btn btn-primary" onClick={() => fetchPage(page - 1)} disabled={loading || page <= 1}>Prev</button>
                  <button className="btn btn-primary" onClick={() => fetchPage(page + 1)} disabled={loading || page >= result.pagination.totalPages}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
