'use client';
import { useState } from 'react';
import {
  createSubscription, checkout, markPaid,
  getSubscription, getOrders, getTransactions,
} from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

interface CheckoutData {
  token?: string;
  checkoutSessionId?: string;
  amount?: number;
  currency?: string;
  clientSubscriptionId?: string;
  plan?: { name?: string; planPrice?: number; fulfillmentCycle?: string; fulfillmentInterval?: number };
  couponApplied?: boolean;
  couponDiscountAmount?: number;
  [key: string]: unknown;
}

interface SubscriptionData {
  id?: string;
  subscriptionId?: string;
  status?: string;
  nextFulfillmentDate?: string;
  [key: string]: unknown;
}

const stepLabel = (n: number, current: Step) =>
  n < current ? 'done' : n === current ? 'active' : '';

export default function EnrollmentPage() {
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 — Create Subscription ────────────────────────────
  const [patientId, setPatientId] = useState('');
  const [planId, setPlanId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [duration, setDuration] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [createRaw, setCreateRaw] = useState<unknown>(null);

  // ── Step 2 — Checkout ────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // ── Step 3 — Mark Paid ───────────────────────────────────────
  const [transactionId, setTransactionId] = useState('');
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState('');
  const [markResult, setMarkResult] = useState<unknown>(null);

  // ── Step 4 — Confirmation ────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'transactions'>('details');
  const [subDetails, setSubDetails] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [transactions, setTransactions] = useState<unknown[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const payload: Parameters<typeof createSubscription>[0] = {
        patientId: patientId.trim(),
        subscriptionPlanId: planId.trim(),
      };
      if (effectiveDate) payload.effectiveDate = effectiveDate;
      if (duration) payload.duration = parseInt(duration, 10);
      if (clinicId.trim()) payload.clinicId = clinicId.trim();

      const result = await createSubscription(payload) as { clientSubscription?: { id?: string }; id?: string };
      setCreateRaw(result);
      const id = result?.clientSubscription?.id ?? (result as SubscriptionData)?.id ?? '';
      setSubscriptionId(String(id));
      setStep(2);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create subscription');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const payload: { clientSubscriptionId: string; couponCode?: string } = {
        clientSubscriptionId: subscriptionId,
      };
      if (couponCode.trim()) payload.couponCode = couponCode.trim();
      const data = await checkout(payload) as CheckoutData;
      setCheckoutData(data);
      setStep(3);
    } catch (e: unknown) {
      setCheckoutError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarkLoading(true);
    setMarkError('');
    try {
      const result = await markPaid({
        clientSubscriptionId: subscriptionId,
        transactionId: transactionId.trim(),
      });
      setMarkResult(result);

      // pre-fetch details for step 4
      const details = await getSubscription(subscriptionId) as SubscriptionData;
      setSubDetails(details);
      const ordersRes = await getOrders(subscriptionId) as { data?: unknown[] } | unknown[];
      setOrders(Array.isArray(ordersRes) ? ordersRes : ((ordersRes as { data?: unknown[] }).data ?? []));

      setStep(4);
    } catch (e: unknown) {
      setMarkError(e instanceof Error ? e.message : 'Mark paid failed');
    } finally {
      setMarkLoading(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'transactions' && transactions.length === 0) {
      setTabLoading(true);
      try {
        const res = await getTransactions(subscriptionId) as { data?: unknown[] } | unknown[];
        setTransactions(Array.isArray(res) ? res : ((res as { data?: unknown[] }).data ?? []));
      } catch { /* ignore */ } finally { setTabLoading(false); }
    }
  };

  const amountDisplay = checkoutData?.amount
    ? `${(checkoutData.amount / 100).toFixed(2)} ${checkoutData.currency ?? 'USD'}`
    : checkoutData?.plan?.planPrice != null
      ? `$${checkoutData.plan.planPrice.toFixed(2)}`
      : '—';

  return (
    <div className="container">
      <h1>Subscription Enrollment</h1>
      <p className="subtitle">
        Multi-step enrollment flow: create subscription → checkout → mark paid → view confirmation.
      </p>

      {/* Steps indicator */}
      <div className="steps">
        {[
          { n: 1, label: 'Create' },
          { n: 2, label: 'Checkout' },
          { n: 3, label: 'Payment' },
          { n: 4, label: 'Confirm' },
        ].map(({ n, label }, i, arr) => (
          <div key={n} style={{ display: 'contents' }}>
            <div className="step">
              <div className={`step-circle ${stepLabel(n, step)}`}>
                {n < step ? '✓' : n}
              </div>
              <span className={`step-label ${stepLabel(n, step)}`}>{label}</span>
            </div>
            {i < arr.length - 1 && <div className={`step-line ${n < step ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Create Subscription ── */}
      {step === 1 && (
        <div className="card">
          <h2>Step 1 — Create Subscription</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Maps to <code>POST /tenants/client-subscriptions</code> — creates a subscription in <strong>PENDING</strong> status.
          </p>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Patient ID (UUID) *</label>
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
            </div>
            <div className="form-group">
              <label>Subscription Plan ID *</label>
              <input type="text" value={planId} onChange={e => setPlanId(e.target.value)}
                placeholder="Numeric ID or SP-prefixed string" required />
              <span className="hint">Use the plan ID from Sample 1 — Plan Management</span>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Effective Date</label>
                <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
                <span className="hint">Defaults to today</span>
              </div>
              <div className="form-group">
                <label>Duration (months)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
                  placeholder="Leave blank for infinite" min="1" step="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Clinic ID (UUID)</label>
              <input type="text" value={clinicId} onChange={e => setClinicId(e.target.value)}
                placeholder="Optional — associate with a clinic" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={createLoading} style={{ width: '100%' }}>
              {createLoading ? 'Creating Subscription…' : 'Create Subscription →'}
            </button>
          </form>
          {createError && <div className="error-box">{createError}</div>}
        </div>
      )}

      {/* ── STEP 2: Checkout ── */}
      {step === 2 && (
        <div className="card">
          <h2>Step 2 — Get Checkout Token</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Maps to <code>POST /tenants/client-subscriptions/checkout</code> — returns the Gr4vy embed token and payment amount.
          </p>

          <div className="success-box">
            Subscription created successfully.{' '}
            <span className="mono">ID: {subscriptionId}</span>
          </div>

          {createRaw && (
            <details style={{ marginBottom: '20px' }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>
                View create subscription response
              </summary>
              <div className="result-box" style={{ marginTop: '8px' }}>
                <pre>{JSON.stringify(createRaw, null, 2)}</pre>
              </div>
            </details>
          )}

          <form onSubmit={handleCheckout}>
            <div className="form-group">
              <label>Coupon Code</label>
              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                placeholder="Optional promotional code" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={checkoutLoading} style={{ width: '100%' }}>
              {checkoutLoading ? 'Getting payment details…' : 'Get Payment Details →'}
            </button>
          </form>
          {checkoutError && <div className="error-box">{checkoutError}</div>}
        </div>
      )}

      {/* ── STEP 3: Payment / Mark Paid ── */}
      {step === 3 && checkoutData && (
        <div className="card">
          <h2>Step 3 — Payment</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            In production, the Gr4vy embed loads using the token below. On payment success, Gr4vy returns a{' '}
            <code>transactionId</code> which you pass to{' '}
            <code>POST /tenants/client-subscriptions/mark-paid</code>.
          </p>

          {/* Checkout summary */}
          <div style={{ marginBottom: '24px' }}>
            <div className="summary-row">
              <span className="summary-label">Plan</span>
              <span className="summary-value">{checkoutData.plan?.name ?? '—'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Amount due</span>
              <span className="summary-value" style={{ fontSize: '1.1rem', color: '#2d3748', fontWeight: 700 }}>
                {amountDisplay}
              </span>
            </div>
            {checkoutData.couponApplied && (
              <div className="summary-row">
                <span className="summary-label">Coupon discount</span>
                <span className="summary-value" style={{ color: '#38a169' }}>
                  −${((checkoutData.couponDiscountAmount ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-label">Fulfillment</span>
              <span className="summary-value">
                Every {checkoutData.plan?.fulfillmentInterval} {checkoutData.plan?.fulfillmentCycle?.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Gr4vy embed placeholder */}
          <div className="embed-placeholder" style={{ marginBottom: '24px' }}>
            <strong>Gr4vy Payment Embed</strong>
            <p style={{ fontSize: '13px', marginBottom: '12px' }}>
              Load <code>https://cdn.gr4vy.app/embed.js</code> and initialise with the token:
            </p>
            <code style={{ fontSize: '12px', wordBreak: 'break-all', display: 'block', background: '#edf2f7', padding: '8px', borderRadius: '4px' }}>
              {checkoutData.token ?? '— token —'}
            </code>
          </div>

          <hr className="section-divider" />

          <form onSubmit={handleMarkPaid}>
            <div className="form-group">
              <label>Transaction ID * <span className="hint">(returned by Gr4vy on payment success)</span></label>
              <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)}
                placeholder="Gr4vy transaction ID" required />
            </div>
            <button type="submit" className="btn btn-success" disabled={markLoading} style={{ width: '100%' }}>
              {markLoading ? 'Activating subscription…' : 'Mark as Paid → Activate'}
            </button>
          </form>
          {markError && <div className="error-box">{markError}</div>}

          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>
              View full checkout response
            </summary>
            <div className="result-box" style={{ marginTop: '8px' }}>
              <pre>{JSON.stringify(checkoutData, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {/* ── STEP 4: Confirmation ── */}
      {step === 4 && (
        <div className="card">
          <h2>Subscription Active</h2>

          {markResult && (() => {
            const r = markResult as { subscription?: { status?: string; nextFulfillmentDate?: string }; orderId?: string };
            return (
              <div className="success-box">
                Subscription activated successfully.
                {r?.subscription?.status && (
                  <> Status: <strong>{r.subscription.status}</strong></>
                )}
                {r?.orderId && (
                  <> · First order ID: <span className="mono">{r.orderId}</span></>
                )}
              </div>
            );
          })()}

          {/* Tabs */}
          <div className="tabs">
            {(['details', 'orders', 'transactions'] as const).map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => handleTabChange(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'details' && subDetails && (
            <>
              <div className="summary-row"><span className="summary-label">Subscription ID</span>
                <span className="summary-value mono">{subDetails.subscriptionId ?? subDetails.id ?? '—'}</span></div>
              <div className="summary-row"><span className="summary-label">Status</span>
                <span className="summary-value">
                  <span className={`badge badge-${(subDetails.status ?? '').toLowerCase().replace('_', '-')}`}>
                    {subDetails.status ?? '—'}
                  </span>
                </span></div>
              <div className="summary-row"><span className="summary-label">Next Fulfillment</span>
                <span className="summary-value">{subDetails.nextFulfillmentDate ? new Date(subDetails.nextFulfillmentDate).toLocaleDateString() : '—'}</span></div>
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>Full details JSON</summary>
                <div className="result-box" style={{ marginTop: '8px' }}>
                  <pre>{JSON.stringify(subDetails, null, 2)}</pre>
                </div>
              </details>
            </>
          )}

          {activeTab === 'orders' && (
            tabLoading ? <p className="empty-state">Loading…</p> :
            orders.length === 0 ? <p className="empty-state">No orders yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>Order ID / No.</th><th>Status</th><th>Fulfillment Date</th><th>Amount</th></tr></thead>
                  <tbody>
                    {orders.map((o, i) => {
                      const order = o as Record<string, unknown>;
                      return (
                        <tr key={i}>
                          <td className="mono">{String(order.orderNo ?? order.id ?? '—')}</td>
                          <td>{String(order.paymentStatus ?? order.status ?? '—')}</td>
                          <td>{order.fulfillmentDate ? new Date(String(order.fulfillmentDate)).toLocaleDateString() : '—'}</td>
                          <td>{order.amount != null ? `$${Number(order.amount).toFixed(2)}` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'transactions' && (
            tabLoading ? <p className="empty-state">Loading…</p> :
            transactions.length === 0 ? <p className="empty-state">No transactions yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>Transaction ID</th><th>Status</th><th>Amount</th><th>Processed At</th></tr></thead>
                  <tbody>
                    {transactions.map((t, i) => {
                      const tx = t as Record<string, unknown>;
                      return (
                        <tr key={i}>
                          <td className="mono">{String(tx.transactionId ?? tx.id ?? '—')}</td>
                          <td>{String(tx.paymentStatus ?? tx.status ?? '—')}</td>
                          <td>{tx.amount != null ? `$${Number(tx.amount).toFixed(2)}` : '—'}</td>
                          <td>{tx.processedAt ? new Date(String(tx.processedAt)).toLocaleString() : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => {
              setStep(1);
              setSubscriptionId(''); setCreateRaw(null); setCheckoutData(null); setMarkResult(null);
              setSubDetails(null); setOrders([]); setTransactions([]);
              setPatientId(''); setPlanId(''); setEffectiveDate(''); setDuration(''); setClinicId('');
              setCouponCode(''); setTransactionId('');
              setActiveTab('details');
            }}>
              + Enroll Another Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
