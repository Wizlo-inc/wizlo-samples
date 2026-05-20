/**
 * Module:    Refills
 * Workflow:  3 — Rx submission
 * File:      app/rx-submission/page.tsx
 * Author:    Abhay Panchal
 * Date:      2026-05-19
 *
 * 4-checkpoint flow (matches the subscriptions/2-enrollment stepper pattern):
 *
 *   1. Order        — verify / paste the refill order id
 *   2. Mark Paid    — POST /tenants/orders/bulk/mark-paid
 *   3. Submit Rx    — POST /rx/orders/:id/submit-refill-rx
 *   4. Transmitted  — success confirmation with pharmacy details
 *
 * Only one panel is visible at a time, controlled by `step`.
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  markOrderPaid,
  submitRefillRx,
  type MarkPaidResponse,
  type SubmitRxResponse,
} from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

const stepClass = (n: number, current: Step) =>
  n < current ? 'done' : n === current ? 'active' : '';

const CHECKPOINTS: Array<{ n: Step; label: string }> = [
  { n: 1, label: 'Order' },
  { n: 2, label: 'Mark Paid' },
  { n: 3, label: 'Submit Rx' },
  { n: 4, label: 'Transmitted' },
];

function RxSubmissionForm() {
  const search = useSearchParams();
  const [step, setStep] = useState<Step>(1);

  const [orderId, setOrderId] = useState('');

  const [paidResult, setPaidResult] = useState<MarkPaidResponse | null>(null);
  const [paidError, setPaidError] = useState('');
  const [paidLoading, setPaidLoading] = useState(false);

  const [rxResult, setRxResult] = useState<SubmitRxResponse | null>(null);
  const [rxError, setRxError] = useState('');
  const [rxLoading, setRxLoading] = useState(false);

  useEffect(() => {
    const fromQuery = search.get('orderId');
    if (fromQuery) {
      setOrderId(fromQuery);
      setStep(2);
    }
  }, [search]);

  const confirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setStep(2);
  };

  const markPaid = async () => {
    if (!orderId.trim()) return;
    setPaidLoading(true);
    setPaidResult(null);
    setPaidError('');
    try {
      const res = await markOrderPaid(orderId.trim());
      setPaidResult(res);
      setStep(3);
    } catch (err) {
      setPaidError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPaidLoading(false);
    }
  };

  const submit = async () => {
    if (!orderId.trim()) return;
    setRxLoading(true);
    setRxResult(null);
    setRxError('');
    try {
      const res = await submitRefillRx(orderId.trim());
      setRxResult(res);
      setStep(4);
    } catch (err) {
      setRxError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRxLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setOrderId('');
    setPaidResult(null);
    setPaidError('');
    setRxResult(null);
    setRxError('');
  };

  return (
    <div className="container">
      <h1>Rx Submission</h1>
      <p className="subtitle">
        Mark the refill order as paid, then transmit the prescription to the pharmacy. The submit
        endpoint refuses unpaid orders.
      </p>

      {/* ── Checkpoint stepper ─────────────────────────────────────── */}
      <div className="steps">
        {CHECKPOINTS.map(({ n, label }, i) => (
          <div key={n} style={{ display: 'contents' }}>
            <div className="step">
              <div className={`step-circle ${stepClass(n, step)}`}>
                {n < step ? '✓' : n}
              </div>
              <span className={`step-label ${stepClass(n, step)}`}>{label}</span>
            </div>
            {i < CHECKPOINTS.length - 1 && (
              <div className={`step-line ${n < step ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Notes & Requirements ─────────────────────────────────────── */}
      <div className="note-box">
        <h4>Notes &amp; Requirements</h4>
        <ul>
          <li>
            The source <strong>encounter</strong> must be in{' '}
            <code>completed</code> status. Refills can only be created from a finalized
            encounter — encounters still in <code>pending</code>, <code>scheduled</code>,
            or <code>cancelled</code> will not appear in the eligibility list.
          </li>
          <li>
            Every <strong>treatment</strong> must be marked{' '}
            <code>indicated</code> by the reviewing provider and must reference an
            existing product. Treatments without an associated product, or marked{' '}
            <code>not_indicated</code> / <code>declined</code>, cannot be refilled.
          </li>
          <li>
            The refill <strong>order</strong> must be in <code>paid</code> status before{' '}
            <code>submit-refill-rx</code> will transmit it. This sample uses the{' '}
            <code>mark-paid</code> endpoint for demonstration — in production, replace it
            with your real payment flow (Stripe/Gr4vy checkout, saved-card charge, cash
            recorded by staff, etc.).
          </li>
          <li>
            The prescription's medication, drug strength, quantity, and directions are
            inherited from the original encounter and <strong>cannot be changed</strong>{' '}
            here. If any of these need to change, create a new encounter instead.
          </li>
        </ul>
      </div>

      {/* ── STEP 1: Order ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <h2>Refill Order</h2>
          <p className="endpoint">
            Paste the <code>orderId</code> returned by{' '}
            <code>POST /tenants/refills/staff/create</code> in step 2.
          </p>
          <form onSubmit={confirmOrder}>
            <div className="form-group">
              <label>Order ID *</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
              />
              <p className="hint">
                UUID of the refill order. Used as the <code>orderIds[]</code> item for{' '}
                <code>mark-paid</code> and as the path param <code>:orderId</code> for{' '}
                <code>submit-refill-rx</code>. Auto-filled when arriving from the create-refill
                page.
              </p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!orderId.trim()}>
              Continue →
            </button>
          </form>
        </div>
      )}

      {/* ── STEP 2: Mark Paid ────────────────────────────────────── */}
      {step === 2 && (
        <div className="card">
          <h2>Mark Order Paid</h2>
          <p className="endpoint">
            <code>POST /tenants/orders/bulk/mark-paid</code>
          </p>
          <div className="success-box" style={{ marginTop: 0, marginBottom: 16 }}>
            Order ID: <span className="mono">{orderId}</span>
          </div>
          <p style={{ color: '#718096', fontSize: 14, marginBottom: 16 }}>
            In production this is replaced by your real payment flow. The only requirement is
            that the order is in <code>paid</code> status before the next checkpoint.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={markPaid}
            disabled={paidLoading}
          >
            {paidLoading ? 'Marking paid…' : 'Mark Order Paid →'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: 8 }}
            onClick={() => setStep(1)}
          >
            ← Back
          </button>

          {paidError && <div className="error-box">{paidError}</div>}
        </div>
      )}

      {/* ── STEP 3: Submit Rx ────────────────────────────────────── */}
      {step === 3 && paidResult && (
        <div className="card">
          <h2>Submit to Pharmacy</h2>
          <p className="endpoint">
            <code>POST /rx/orders/{orderId}/submit-refill-rx</code>
          </p>

          <div className="success-box" style={{ marginTop: 0, marginBottom: 16 }}>
            ✓ {paidResult.message}
          </div>

          <div className="result-box" style={{ marginTop: 0, marginBottom: 16 }}>
            <pre>{JSON.stringify(paidResult, null, 2)}</pre>
          </div>

          <p style={{ color: '#718096', fontSize: 14, marginBottom: 16 }}>
            Transmits the prescription to the configured pharmacy provider (DigitalRx, Lifefile,
            etc.).
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={rxLoading}
          >
            {rxLoading ? 'Submitting Rx…' : 'Submit Refill Rx →'}
          </button>

          {rxError && <div className="error-box">{rxError}</div>}
        </div>
      )}

      {/* ── STEP 4: Transmitted ──────────────────────────────────── */}
      {step === 4 && rxResult && (
        <div className="card">
          <h2>Prescription Transmitted</h2>
          <div className="success-box">
            ✓ {rxResult.message ?? 'Rx submission complete.'}{' '}
            <span className="badge badge-green">
              {rxResult.data?.successCount ?? 0}/{rxResult.data?.totalItems ?? 0} succeeded
            </span>
          </div>

          {rxResult.data?.orderId && (
            <p style={{ marginTop: 12, fontSize: 14 }}>
              <strong>Order ID:</strong>{' '}
              <span className="mono">{rxResult.data.orderId}</span>
            </p>
          )}
          {rxResult.data?.encounterStatus && (
            <p style={{ fontSize: 14, color: '#4a5568' }}>
              Encounter status: <code>{rxResult.data.encounterStatus}</code>
            </p>
          )}

          <div className="result-box">
            <pre>{JSON.stringify(rxResult, null, 2)}</pre>
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={reset}>
              + Submit Another Refill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RxSubmissionPage() {
  return (
    <Suspense fallback={<div className="container">Loading…</div>}>
      <RxSubmissionForm />
    </Suspense>
  );
}
