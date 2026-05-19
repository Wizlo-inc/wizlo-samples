'use client';

import { useState, useCallback } from 'react';
import {
  listPharmacies,
  getPharmacy,
  updatePharmacyStatus,
  updatePharmacyLive,
  TenantPharmacy,
} from '../lib/api';

type ActiveFilter = 'all' | 'active' | 'inactive';
type LiveFilter  = 'all' | 'live'   | 'offline';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive
    ? <span className="badge badge-active">Active</span>
    : <span className="badge badge-inactive">Inactive</span>;
}
function LiveBadge({ isLive }: { isLive: boolean }) {
  return isLive
    ? <span className="badge badge-live">Live</span>
    : <span className="badge badge-offline">Offline</span>;
}

export default function PharmaciesPage() {
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [liveFilter,   setLiveFilter]   = useState<LiveFilter>('all');

  const [pharmacies,  setPharmacies]  = useState<TenantPharmacy[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError,   setListError]   = useState('');
  const [listFetched, setListFetched] = useState(false);

  const [selected,      setSelected]      = useState<TenantPharmacy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError,   setDetailError]   = useState('');
  const [showRaw,       setShowRaw]       = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ── Fetch list ── */
  const fetchList = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setListLoading(true);
    setListError('');
    setSelected(null);
    try {
      const res = await listPharmacies({
        search:   search.trim() || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        isLive:   liveFilter   === 'all' ? undefined : liveFilter   === 'live',
      });
      setPharmacies(Array.isArray(res) ? res : (res.data ?? []));
      setListFetched(true);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to fetch pharmacies');
    } finally {
      setListLoading(false);
    }
  }, [search, activeFilter, liveFilter]);

  /* ── Select / fetch detail ── */
  const handleSelect = async (item: TenantPharmacy) => {
    if (selected?.id === item.id) { setSelected(null); return; }
    setDetailLoading(true);
    setDetailError('');
    setSelected(null);
    setShowRaw(false);
    try {
      setSelected(await getPharmacy(item.id));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to fetch pharmacy details');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── Toggle status ── */
  const toggleStatus = async (item: TenantPharmacy) => {
    setTogglingId(item.id);
    try {
      const updated = await updatePharmacyStatus(item.id, !item.isActive);
      setPharmacies(prev => prev.map(p => p.id === item.id ? { ...p, isActive: updated.isActive } : p));
      if (selected?.id === item.id) setSelected(s => s ? { ...s, isActive: updated.isActive } : s);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Toggle live ── */
  const toggleLive = async (item: TenantPharmacy) => {
    setTogglingId(item.id);
    try {
      const updated = await updatePharmacyLive(item.id, !item.isLive);
      setPharmacies(prev => prev.map(p => p.id === item.id ? { ...p, isLive: updated.isLive } : p));
      if (selected?.id === item.id) setSelected(s => s ? { ...s, isLive: updated.isLive } : s);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update live status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>Pharmacy Management</h1>
        <p>Browse and manage pharmacies available to your clinic via the Wizlo API.</p>
      </div>

      {/* ── List card ── */}
      <div className="card">
        <div className="card-title">List Pharmacies</div>

        <form onSubmit={fetchList}>
          <div className="filter-bar">
            <div className="filter-group grow">
              <label>Search by name</label>
              <input
                type="text"
                placeholder="e.g. Greenwich"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Active status</label>
              <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as ActiveFilter)}>
                <option value="all">All</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Live status</label>
              <select value={liveFilter} onChange={e => setLiveFilter(e.target.value as LiveFilter)}>
                <option value="all">All</option>
                <option value="live">Live only</option>
                <option value="offline">Offline only</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={listLoading}>
              {listLoading ? 'Loading…' : 'Fetch Pharmacies'}
            </button>
          </div>
        </form>

        {listError && <div className="error-box">{listError}</div>}

        {listFetched && (
          pharmacies.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏥</div>
              <p>No pharmacies found for the selected filters.</p>
            </div>
          ) : (
            <div className="pharmacy-list">
              {pharmacies.map(item => (
                <div
                  key={item.id}
                  className={`pharmacy-row${selected?.id === item.id ? ' selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <div className="pharmacy-avatar">
                    {initials(item.pharmacy?.name || '?')}
                  </div>

                  <div className="pharmacy-info">
                    <div className="pharmacy-name">{item.pharmacy?.name || '—'}</div>
                    <div className="pharmacy-meta">
                      {[item.pharmacy?.email, item.pharmacy?.mobile].filter(Boolean).join(' · ') || 'No contact info'}
                    </div>
                  </div>

                  <div className="pharmacy-badges">
                    <ActiveBadge isActive={item.isActive} />
                    <LiveBadge   isLive={item.isLive} />
                  </div>

                  <div className="pharmacy-action" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleSelect(item)}
                    >
                      {selected?.id === item.id ? 'Hide ↑' : 'Details →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Detail card ── */}
      {(detailLoading || detailError || selected) && (
        <div className="card detail-panel">
          {detailLoading && (
            <div className="empty-state"><p>Loading pharmacy details…</p></div>
          )}
          {detailError && <div className="error-box">{detailError}</div>}

          {selected && !detailLoading && (
            <>
              {/* Top bar */}
              <div className="detail-top">
                <div>
                  <div className="detail-name">{selected.pharmacy?.name}</div>
                  <div className="detail-badges">
                    <ActiveBadge isActive={selected.isActive} />
                    <LiveBadge   isLive={selected.isLive} />
                  </div>
                </div>
                <div className="detail-controls">
                  <button
                    className={`btn btn-sm ${selected.isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleStatus(selected)}
                    disabled={togglingId === selected.id}
                  >
                    {togglingId === selected.id ? '…' : selected.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className={`btn btn-sm ${selected.isLive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleLive(selected)}
                    disabled={togglingId === selected.id}
                  >
                    {togglingId === selected.id ? '…' : selected.isLive ? 'Set Offline' : 'Set Live'}
                  </button>
                </div>
              </div>

              {/* Fields grid */}
              <div className="detail-grid">
                <div className="detail-field">
                  <span className="label">Assignment ID</span>
                  <span className="value">{selected.id}</span>
                </div>
                <div className="detail-field">
                  <span className="label">Pharmacy ID</span>
                  <span className="value">{selected.pharmacy?.id || '—'}</span>
                </div>
                <div className="detail-field">
                  <span className="label">Email</span>
                  <span className="value">{selected.pharmacy?.email || '—'}</span>
                </div>
                <div className="detail-field">
                  <span className="label">Mobile</span>
                  <span className="value">
                    {selected.pharmacy?.countryCode
                      ? `+${selected.pharmacy.countryCode} ${selected.pharmacy.mobile}`
                      : selected.pharmacy?.mobile || '—'}
                  </span>
                </div>
                {selected.pharmacy?.fax && (
                  <div className="detail-field">
                    <span className="label">Fax</span>
                    <span className="value">{selected.pharmacy.fax}</span>
                  </div>
                )}
                <div className="detail-field">
                  <span className="label">Address</span>
                  <span className="value">
                    {[selected.pharmacy?.address, selected.pharmacy?.city, selected.pharmacy?.postalCode]
                      .filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              </div>

              {/* Raw JSON */}
              <hr className="divider" />
              <button className="raw-toggle" onClick={() => setShowRaw(v => !v)}>
                {showRaw ? '▲ Hide' : '▼ Show'} raw response
              </button>
              {showRaw && (
                <div className="result-box">
                  <pre>{JSON.stringify(selected, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
