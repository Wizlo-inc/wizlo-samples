/**
 * Module:    Refills
 * Workflow:  2 — Create refill order
 * File:      app/create-refill/page.tsx
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-18
 *
 * Form for POST /tenants/refills/staff/create. Pre-fills patientId and
 * encounterTreatmentIds from the query string when the user lands here from
 * step 1. Surfaces the resulting orderId and a deep-link to step 3.
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createRefill, type RefillOrder } from '@/lib/api';

function CreateRefillForm() {
  const search = useSearchParams();
  const [patientId, setPatientId] = useState('');
  const [idsText, setIdsText] = useState('');
  const [bypass, setBypass] = useState(false);
  const [result, setResult] = useState<RefillOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPatientId(search.get('patientId') ?? '49f623c9-0fc3-4e66-9b5e-56c955a71e43');
    setIdsText(search.get('ids') ?? '');
  }, [search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const encounterTreatmentIds = idsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await createRefill({
        patientId: patientId.trim(),
        encounterTreatmentIds,
        bypassDaysOfSupply: bypass || undefined,
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const orderId = result?.orderId ?? result?.id;

  return (
    <div className="container">
      <div className="step-header">
        <span className="step-num">2</span>
        <h1 className="step-title">Create Refill Order</h1>
      </div>
      <p className="subtitle">
        Bundles one or more <code>encounterTreatmentId</code>s into a single <code>REFILL</code>{' '}
        order. Medication, drug strength, quantity, and directions are inherited from the source
        encounter &mdash; they cannot be changed here.
      </p>

      <div className="card">
        <h2>Refill request</h2>
        <p className="endpoint">
          <code>POST /tenants/refills/staff/create</code>
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Patient ID *</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
            />
            <p className="hint">
              UUID of the patient. Maps to the <code>patientId</code> field in the request body.
            </p>
          </div>
          <div className="form-group">
            <label>Encounter Treatment IDs *</label>
            <textarea
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
              placeholder="6e6e4fbc-cd27-4a1a-9965-ae69d0d78a08, a1b2c3d4-…"
              required
            />
            <p className="hint">
              Comma-separated UUIDs. Maps to <code>encounterTreatmentIds</code> in the request
              body. All IDs must belong to the <strong>same encounter</strong>. Pull these from{' '}
              <Link href="/eligibility">step 1</Link>.
            </p>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={bypass}
                onChange={(e) => setBypass(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>
                <strong>bypassDaysOfSupply</strong> &mdash; optional, staff override
              </span>
            </label>
            <p className="hint">
              When checked, sends <code>bypassDaysOfSupply: true</code>. Skips only the
              dispensing-window check &mdash; remaining refills and prescription expiry are still
              enforced.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Refill Order…' : 'Create Refill Order'}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {result && (
          <>
            <div className="success-box">
              ✓ Refill order created. <code>orderId:</code>{' '}
              <strong className="mono">{orderId}</strong>
            </div>
            <div className="result-box">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
            {orderId && (
              <div style={{ marginTop: 14 }}>
                <Link
                  className="btn btn-primary"
                  href={`/rx-submission?orderId=${encodeURIComponent(orderId)}`}
                >
                  → Continue to step 3 (Rx submission)
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CreateRefillPage() {
  return (
    <Suspense fallback={<div className="container">Loading…</div>}>
      <CreateRefillForm />
    </Suspense>
  );
}
