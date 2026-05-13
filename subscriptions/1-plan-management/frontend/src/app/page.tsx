'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  createPlan, listPlans, getStatusCounts, updatePlanStatus, getPlanById,
  type CreatePlanData,
} from '@/lib/api';

interface Plan {
  id?: number | string;
  subscriptionId?: string;
  name?: string;
  planPrice?: number;
  fulfillmentCycle?: string;
  fulfillmentInterval?: number;
  status?: string;
  planCreatedFor?: string;
  maxRenewal?: number | null;
  createdAt?: string;
  [key: string]: unknown;
}

interface StatusCounts {
  draft?: number;
  active?: number;
  inactive?: number;
  DRAFT?: number;
  ACTIVE?: number;
  INACTIVE?: number;
}

const CYCLES = ['MONTHLY', 'WEEKLY', 'DAILY', 'YEARLY'];
const STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'];

const badgeClass = (s?: string) =>
  s === 'ACTIVE' ? 'badge badge-active' : s === 'INACTIVE' ? 'badge badge-inactive' : 'badge badge-draft';

const nextStatus = (s?: string) =>
  s === 'ACTIVE' ? 'INACTIVE' : s === 'INACTIVE' ? 'ACTIVE' : 'ACTIVE';

export default function PlanManagementPage() {
  // ── form state ──────────────────────────────────────────────
  const [name, setName] = useState('');
  const [productIds, setProductIds] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [cycle, setCycle] = useState('MONTHLY');
  const [interval, setInterval] = useState('1');
  const [cutoffHours, setCutoffHours] = useState('');
  const [pauseCutoff, setPauseCutoff] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [planFor, setPlanFor] = useState('PRODUCT');
  const [maxRenewal, setMaxRenewal] = useState('');
  const [reassessmentFormId, setReassessmentFormId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<unknown>(null);
  const [createError, setCreateError] = useState('');

  // ── list state ───────────────────────────────────────────────
  const [plans, setPlans] = useState<Plan[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // ── status counts ────────────────────────────────────────────
  const [counts, setCounts] = useState<StatusCounts | null>(null);

  // ── detail panel ─────────────────────────────────────────────
  const [detailId, setDetailId] = useState('');
  const [detail, setDetail] = useState<unknown>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // ── toggle status ────────────────────────────────────────────
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState('');

  const fetchPlans = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.filter = filterStatus;
      if (search.trim()) params.search = search.trim();
      const data = await listPlans(params) as { data?: Plan[] } | Plan[];
      setPlans(Array.isArray(data) ? data : ((data as { data?: Plan[] }).data ?? []));
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setListLoading(false);
    }
  }, [filterStatus, search]);

  const fetchCounts = useCallback(async () => {
    try {
      const data = await getStatusCounts() as StatusCounts;
      setCounts(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchCounts();
  }, [fetchPlans, fetchCounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);
    setCreateError('');
    try {
      const payload: CreatePlanData = {
        name: name.trim(),
        productIds: productIds.split('\n').map(s => s.trim()).filter(Boolean),
        planPrice: parseFloat(planPrice),
        fulfillmentCycle: cycle,
        fulfillmentInterval: parseInt(interval, 10),
        status,
        planFor,
        reassessmentFormId: reassessmentFormId.trim(),
      } as CreatePlanData;
      if (discount) payload.firstPurchaseDiscount = parseFloat(discount);
      if (cutoffHours) payload.fulfillmentDateChangeCutoffHours = parseInt(cutoffHours, 10);
      if (pauseCutoff) payload.pauseCutoffDays = parseInt(pauseCutoff, 10);
      if (maxRenewal) payload.maxRenewal = parseInt(maxRenewal, 10);

      const result = await createPlan(payload);
      setCreateResult(result);
      fetchPlans();
      fetchCounts();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create plan');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    const id = String(plan.id ?? plan.subscriptionId ?? '');
    if (!id) return;
    setToggleLoading(id);
    setToggleError('');
    try {
      await updatePlanStatus(id, nextStatus(plan.status));
      fetchPlans();
      fetchCounts();
    } catch (e: unknown) {
      setToggleError(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleGetDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailId.trim()) return;
    setDetailLoading(true);
    setDetail(null);
    setDetailError('');
    try {
      const data = await getPlanById(detailId.trim());
      setDetail(data);
    } catch (e: unknown) {
      setDetailError(e instanceof Error ? e.message : 'Failed to fetch plan');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Subscription Plan Management</h1>
      <p className="subtitle">
        Create and manage subscription plans via <code>POST/GET/PUT/PATCH /tenants/subscription-plans</code>.
      </p>

      {/* ── Status Counts ── */}
      <div className="stats-bar">
        <div className="stat-card draft">
          <div className="stat-label">DRAFT</div>
          <div className="stat-value">{counts?.draft ?? counts?.DRAFT ?? '—'}</div>
        </div>
        <div className="stat-card active">
          <div className="stat-label">ACTIVE</div>
          <div className="stat-value">{counts?.active ?? counts?.ACTIVE ?? '—'}</div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-label">INACTIVE</div>
          <div className="stat-value">{counts?.inactive ?? counts?.INACTIVE ?? '—'}</div>
        </div>
      </div>

      <div className="two-col">
        {/* ── Create Plan Form ── */}
        <div className="col-form">
          <div className="card">
            <h2>Create Plan</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
              Maps to <code>POST /tenants/subscription-plans</code>
            </p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Plan Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Monthly Wellness Plan" required />
              </div>

              <div className="form-group">
                <label>Product IDs * <span className="hint">(one UUID per line)</span></label>
                <textarea value={productIds} onChange={e => setProductIds(e.target.value)}
                  placeholder={'uuid-1\nuuid-2'} required />
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Plan Price ($) *</label>
                  <input type="number" value={planPrice} onChange={e => setPlanPrice(e.target.value)}
                    placeholder="99.00" min="0.01" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>First Purchase Discount ($)</label>
                  <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                    placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Fulfillment Cycle *</label>
                  <select value={cycle} onChange={e => setCycle(e.target.value)}>
                    {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Interval *</label>
                  <input type="number" value={interval} onChange={e => setInterval(e.target.value)}
                    min="1" step="1" required />
                  <span className="hint">Every N cycles</span>
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Change Cutoff (hours)</label>
                  <input type="number" value={cutoffHours} onChange={e => setCutoffHours(e.target.value)}
                    placeholder="48" min="1" step="1" />
                </div>
                <div className="form-group">
                  <label>Pause Cutoff (days)</label>
                  <input type="number" value={pauseCutoff} onChange={e => setPauseCutoff(e.target.value)}
                    placeholder="7" min="1" step="1" />
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Plan Created For</label>
                  <select value={planFor} onChange={e => setPlanFor(e.target.value)}>
                    <option value="PRODUCT">PRODUCT</option>
                    <option value="SERVICE">SERVICE</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Max Renewals</label>
                  <input type="number" value={maxRenewal} onChange={e => setMaxRenewal(e.target.value)}
                    placeholder="Leave blank for unlimited" min="1" step="1" />
                </div>
              </div>

              <div className="form-group">
                <label>Reassessment Form ID (UUID) *</label>
                <input type="text" value={reassessmentFormId}
                  onChange={e => setReassessmentFormId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
              </div>

              <button type="submit" className="btn btn-primary" disabled={createLoading} style={{ width: '100%' }}>
                {createLoading ? 'Creating...' : 'Create Plan'}
              </button>
            </form>

            {createResult != null && (
              <div className="result-box">
                <div style={{ marginBottom: '8px', color: '#276749', fontWeight: 600 }}>Plan created</div>
                <details>
                  <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>Raw response</summary>
                  <pre style={{ marginTop: '8px' }}>{JSON.stringify(createResult, null, 2)}</pre>
                </details>
              </div>
            )}
            {createError && <div className="error-box">{createError}</div>}
          </div>

          {/* ── Get Plan by ID ── */}
          <div className="card">
            <h2>Get Plan Details</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
              Maps to <code>GET /tenants/subscription-plans/:id</code>
            </p>
            <form onSubmit={handleGetDetail}>
              <div className="form-group">
                <label>Plan ID *</label>
                <input type="text" value={detailId} onChange={e => setDetailId(e.target.value)}
                  placeholder="Numeric ID or SP-prefixed" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={detailLoading}>
                {detailLoading ? 'Fetching...' : 'Fetch Plan'}
              </button>
            </form>
            {detail != null && (
              <div className="result-box">
                <pre>{JSON.stringify(detail, null, 2)}</pre>
              </div>
            )}
            {detailError && <div className="error-box">{detailError}</div>}
          </div>
        </div>

        {/* ── Plans Table ── */}
        <div className="col-table">
          <div className="card">
            <h2>All Plans</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
              Maps to <code>GET /tenants/subscription-plans</code>
            </p>

            {/* Filters */}
            <div className="row" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => fetchPlans()} disabled={listLoading}>
                  {listLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>

            {toggleError && <div className="error-box" style={{ marginBottom: '12px' }}>{toggleError}</div>}

            {listLoading ? (
              <p className="empty-state">Loading plans…</p>
            ) : listError ? (
              <div className="error-box">{listError}</div>
            ) : plans.length === 0 ? (
              <p className="empty-state">No plans found. Create one using the form.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Cycle</th>
                      <th>For</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan, i) => {
                      const id = String(plan.id ?? plan.subscriptionId ?? i);
                      return (
                        <tr key={id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#718096' }}>
                            {plan.subscriptionId ?? plan.id ?? '—'}
                          </td>
                          <td style={{ fontWeight: 500 }}>{plan.name ?? '—'}</td>
                          <td>${plan.planPrice != null ? Number(plan.planPrice).toFixed(2) : '—'}</td>
                          <td>
                            {plan.fulfillmentInterval && plan.fulfillmentCycle
                              ? `Every ${plan.fulfillmentInterval} ${plan.fulfillmentCycle.toLowerCase()}`
                              : '—'}
                          </td>
                          <td>{plan.planCreatedFor ?? '—'}</td>
                          <td>
                            <span className={badgeClass(plan.status)}>{plan.status ?? '—'}</span>
                          </td>
                          <td>
                            <div className="action-group">
                              <button
                                className="btn btn-sm btn-ghost"
                                disabled={toggleLoading === id}
                                onClick={() => handleToggleStatus(plan)}
                                title={`Switch to ${nextStatus(plan.status)}`}
                              >
                                {toggleLoading === id ? '…' : `→ ${nextStatus(plan.status)}`}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
