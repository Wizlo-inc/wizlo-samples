'use client';
import { useState } from 'react';
import {
  getAutopay, updateAutopay, updatePaymentMethod,
  retryPayment, resendPaymentLink,
} from '@/lib/api';

interface AutopayConfig {
  subscriptionId?: string;
  autopayEnabled?: boolean;
  autopayPaymentMethodId?: string | null;
  autopayEnabledAt?: string | null;
  maxPaymentRetries?: number;
  retryIntervalDays?: number;
  nextPaymentRetryDate?: string | null;
  consecutiveFailures?: number;
  paymentMethodDetails?: {
    scheme?: string;
    details?: { cardNumberLast4?: string };
    expirationDate?: string;
  } | null;
  activePaymentLinkUrl?: string | null;
  activePaymentLinkExpiry?: string | null;
  [key: string]: unknown;
}

export default function AutopayPage() {
  // ── Lookup ───────────────────────────────────────────────────
  const [subId, setSubId] = useState('');
  const [config, setConfig] = useState<AutopayConfig | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // ── Autopay toggle ───────────────────────────────────────────
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState('');
  const [payMethodIdForEnable, setPayMethodIdForEnable] = useState('');
  const [showEnableForm, setShowEnableForm] = useState(false);

  // ── Change payment method ────────────────────────────────────
  const [showChangeCard, setShowChangeCard] = useState(false);
  const [newPayMethodId, setNewPayMethodId] = useState('');
  const [changeCardLoading, setChangeCardLoading] = useState(false);
  const [changeCardError, setChangeCardError] = useState('');

  // ── Retry / Resend ───────────────────────────────────────────
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [retryResult, setRetryResult] = useState<unknown>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendResult, setResendResult] = useState<unknown>(null);

  const reload = async (id = subId) => {
    const data = await getAutopay(id) as AutopayConfig;
    setConfig(data);
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subId.trim()) return;
    setFetchLoading(true); setFetchError(''); setConfig(null);
    setRetryResult(null); setResendResult(null);
    try {
      await reload(subId.trim());
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load autopay config');
    } finally { setFetchLoading(false); }
  };

  const handleToggleAutopay = async () => {
    if (!config) return;
    if (!config.autopayEnabled && !payMethodIdForEnable.trim()) {
      setShowEnableForm(true);
      return;
    }
    setToggleLoading(true); setToggleError('');
    try {
      const payload: { autopayEnabled: boolean; autopayPaymentMethodId?: string } = {
        autopayEnabled: !config.autopayEnabled,
      };
      if (!config.autopayEnabled && payMethodIdForEnable.trim()) {
        payload.autopayPaymentMethodId = payMethodIdForEnable.trim();
      }
      await updateAutopay(subId, payload);
      setShowEnableForm(false);
      setPayMethodIdForEnable('');
      await reload();
    } catch (err: unknown) {
      setToggleError(err instanceof Error ? err.message : 'Toggle failed');
    } finally { setToggleLoading(false); }
  };

  const handleChangeCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayMethodId.trim()) return;
    setChangeCardLoading(true); setChangeCardError('');
    try {
      await updatePaymentMethod(subId, newPayMethodId.trim());
      setShowChangeCard(false);
      setNewPayMethodId('');
      await reload();
    } catch (err: unknown) {
      setChangeCardError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally { setChangeCardLoading(false); }
  };

  const handleRetry = async () => {
    setRetryLoading(true); setRetryError(''); setRetryResult(null);
    try {
      const result = await retryPayment(subId);
      setRetryResult(result);
      await reload();
    } catch (err: unknown) {
      setRetryError(err instanceof Error ? err.message : 'Retry failed');
    } finally { setRetryLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true); setResendError(''); setResendResult(null);
    try {
      const result = await resendPaymentLink(subId);
      setResendResult(result);
    } catch (err: unknown) {
      setResendError(err instanceof Error ? err.message : 'Resend failed');
    } finally { setResendLoading(false); }
  };

  const card = config?.paymentMethodDetails;

  return (
    <div className="container">
      <h1>Autopay Management</h1>
      <p className="subtitle">
        Configure autopay, manage saved payment methods, and retry failed payments via{' '}
        <code>/tenants/client-subscriptions/:id/autopay</code>.
      </p>

      {/* Lookup */}
      <div className="card">
        <h2>Load Subscription Autopay Config</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Maps to <code>GET /tenants/client-subscriptions/:id/autopay</code>
        </p>
        <form onSubmit={handleFetch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <input type="text" value={subId} onChange={e => setSubId(e.target.value)}
              placeholder="Subscription UUID" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={fetchLoading}>
            {fetchLoading ? 'Loading…' : 'Load Config'}
          </button>
        </form>
        {fetchError && <div className="error-box">{fetchError}</div>}
      </div>

      {config && (
        <>
          {/* Payment Failed alert */}
          {config.consecutiveFailures != null && config.consecutiveFailures > 0 && (
            <div className="warning-box">
              ⚠ <strong>{config.consecutiveFailures} consecutive payment failure{config.consecutiveFailures > 1 ? 's' : ''}.</strong>
              {config.nextPaymentRetryDate && (
                <> Next automatic retry: <strong>{new Date(config.nextPaymentRetryDate).toLocaleString()}</strong>.</>
              )}
            </div>
          )}

          <div className="card-grid">
            {/* ── Autopay Toggle Card ── */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h2>Autopay</h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                <code>PATCH /tenants/client-subscriptions/:id/autopay</code>
              </p>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Automatic payments</div>
                  <div className="toggle-desc">
                    {config.autopayEnabled ? 'Enabled — charges saved card on renewal' : 'Disabled — patient pays manually each cycle'}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={!!config.autopayEnabled}
                    onChange={handleToggleAutopay} disabled={toggleLoading} />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Enable form — needs payment method ID */}
              {showEnableForm && !config.autopayEnabled && (
                <div style={{ marginTop: '14px', padding: '14px', background: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Gr4vy Payment Method ID *</label>
                    <input type="text" value={payMethodIdForEnable}
                      onChange={e => setPayMethodIdForEnable(e.target.value)}
                      placeholder="Required to enable autopay" />
                    <span className="hint">Obtained from the Gr4vy embed after a successful payment</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-success" disabled={toggleLoading || !payMethodIdForEnable.trim()}
                      onClick={handleToggleAutopay}>
                      {toggleLoading ? 'Enabling…' : 'Enable Autopay'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowEnableForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {toggleError && <div className="error-box">{toggleError}</div>}

              <div className="section-divider" />

              <div className="stat-row">
                <span className="stat-key">Max retries</span>
                <span className="stat-val">{config.maxPaymentRetries ?? '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">Retry interval</span>
                <span className="stat-val">{config.retryIntervalDays != null ? `${config.retryIntervalDays} days` : '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">Consecutive failures</span>
                <span className={`stat-val ${(config.consecutiveFailures ?? 0) > 0 ? 'danger' : 'success'}`}>
                  {config.consecutiveFailures ?? 0}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-key">Next retry</span>
                <span className="stat-val">
                  {config.nextPaymentRetryDate ? new Date(config.nextPaymentRetryDate).toLocaleDateString() : '—'}
                </span>
              </div>
              {config.autopayEnabledAt && (
                <div className="stat-row">
                  <span className="stat-key">Enabled at</span>
                  <span className="stat-val">{new Date(config.autopayEnabledAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* ── Payment Method Card ── */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h2>Payment Method</h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                <code>PATCH /tenants/client-subscriptions/:id/autopay/payment-method</code>
              </p>

              {card ? (
                <div className="card-chip">
                  {card.scheme && <span className="card-scheme">{card.scheme}</span>}
                  <span className="card-number">•••• •••• •••• {card.details?.cardNumberLast4 ?? '????'}</span>
                  {card.expirationDate && <span className="card-expiry">Exp {card.expirationDate}</span>}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '6px', color: '#a0aec0', fontSize: '0.875rem', marginBottom: '16px', textAlign: 'center' }}>
                  No saved payment method
                </div>
              )}

              {!showChangeCard ? (
                <button className="btn btn-sm btn-secondary" onClick={() => setShowChangeCard(true)}>
                  Change Card
                </button>
              ) : (
                <form onSubmit={handleChangeCard}>
                  <div className="form-group">
                    <label>New Gr4vy Payment Method ID *</label>
                    <input type="text" value={newPayMethodId}
                      onChange={e => setNewPayMethodId(e.target.value)}
                      placeholder="Gr4vy payment method ID" required />
                    <span className="hint">Obtained from the Gr4vy embed after adding a new card</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={changeCardLoading}>
                      {changeCardLoading ? 'Saving…' : 'Save New Card'}
                    </button>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setShowChangeCard(false); setNewPayMethodId(''); }}>
                      Cancel
                    </button>
                  </div>
                  {changeCardError && <div className="error-box">{changeCardError}</div>}
                </form>
              )}

              <div className="section-divider" />

              {/* Active payment link */}
              <h3>Payment Link</h3>
              {config.activePaymentLinkUrl ? (
                <>
                  <div className="stat-row">
                    <span className="stat-key">Active link</span>
                    <a href={config.activePaymentLinkUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize: '0.8125rem', color: '#4299e1', wordBreak: 'break-all' }}>
                      Open link ↗
                    </a>
                  </div>
                  {config.activePaymentLinkExpiry && (
                    <div className="stat-row">
                      <span className="stat-key">Expires</span>
                      <span className="stat-val">{new Date(config.activePaymentLinkExpiry).toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#a0aec0', marginBottom: '12px' }}>No active payment link</p>
              )}
            </div>
          </div>

          {/* ── Retry / Resend Actions ── */}
          <div className="card">
            <h2>Payment Actions</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
              Retry a failed charge or send the patient a fresh payment link by email.
            </p>

            <div className="action-row">
              <div style={{ flex: 1 }}>
                <button className="btn btn-warning" onClick={handleRetry} disabled={retryLoading}>
                  {retryLoading ? 'Retrying…' : 'Retry Payment'}
                </button>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '6px' }}>
                  <code>POST /tenants/client-subscriptions/:id/retry-payment</code>
                </p>
                {retryError && <div className="error-box">{retryError}</div>}
                {retryResult && (
                  <div className="result-box">
                    <div style={{ color: '#276749', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Retry initiated</div>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Raw response</summary>
                      <pre style={{ marginTop: '6px' }}>{JSON.stringify(retryResult, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <button className="btn btn-primary" onClick={handleResend} disabled={resendLoading}>
                  {resendLoading ? 'Sending…' : 'Resend Payment Link'}
                </button>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '6px' }}>
                  <code>POST /tenants/client-subscriptions/:id/resend-payment-link</code>
                </p>
                {resendError && <div className="error-box">{resendError}</div>}
                {resendResult && (
                  <div className="result-box">
                    <div style={{ color: '#276749', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Payment link sent</div>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Raw response</summary>
                      <pre style={{ marginTop: '6px' }}>{JSON.stringify(resendResult, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raw config */}
          <details>
            <summary style={{ cursor: 'pointer', color: '#718096', fontSize: '13px', marginBottom: '8px' }}>
              View full autopay config JSON
            </summary>
            <div className="result-box">
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
