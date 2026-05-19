/**
 * Module:    Refills
 * Workflow:  1 — Eligibility check
 * File:      app/eligibility/page.tsx
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-18
 *
 * Two-stage UI:
 *   a) Find refillable encounters for a patient.
 *   b) Drill into one encounter and see per-treatment refill status. Click
 *      "Use this for refill" to deep-link to step 2 with the IDs pre-filled.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  getEligibleEncounters,
  getEncounterTreatments,
  type EligibleEncounter,
  type Treatment,
} from '@/lib/api';

const EDGECASES_URL = 'http://localhost:3014';

export default function EligibilityPage() {
  const [patientId, setPatientId] = useState('49f623c9-0fc3-4e66-9b5e-56c955a71e43');
  const [encounters, setEncounters] = useState<EligibleEncounter[] | null>(null);
  const [encountersRaw, setEncountersRaw] = useState<unknown>(null);
  const [encError, setEncError] = useState('');
  const [encLoading, setEncLoading] = useState(false);

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [treatments, setTreatments] = useState<Treatment[] | null>(null);
  const [treatmentsRaw, setTreatmentsRaw] = useState<unknown>(null);
  const [txError, setTxError] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const fetchEncounters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    setEncLoading(true);
    setEncounters(null);
    setEncountersRaw(null);
    setEncError('');
    setSelectedEncounterId(null);
    setTreatments(null);
    setTreatmentsRaw(null);
    try {
      const res = await getEligibleEncounters(patientId.trim());
      setEncountersRaw(res);
      setEncounters(res.data ?? []);
    } catch (err) {
      setEncError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setEncLoading(false);
    }
  };

  const fetchTreatments = async (encounterId: number) => {
    setSelectedEncounterId(String(encounterId));
    setTxLoading(true);
    setTreatments(null);
    setTreatmentsRaw(null);
    setTxError('');
    try {
      const res = await getEncounterTreatments(String(encounterId));
      setTreatmentsRaw(res);
      setTreatments(res.data?.treatments ?? []);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTxLoading(false);
    }
  };

  const refillableIds = (treatments ?? [])
    .filter((t) => (t.refillInfo?.remainingRefills ?? 0) > 0 && t.refillInfo?.canRefillNow)
    .map((t) => t.encounterTreatmentId);

  return (
    <div className="container">
      <div className="step-header">
        <span className="step-num">1</span>
        <h1 className="step-title">Eligibility Check</h1>
      </div>
      <p className="subtitle">
        Find encounters and treatments the patient is allowed to refill right now. If either
        eligibility check fails, head to the{' '}
        <a href={EDGECASES_URL} target="_blank" rel="noreferrer">
          edge-cases sample
        </a>{' '}
        (runs separately on <code>:3014</code>).
      </p>

      <div className="card">
        <h2>Step 1a &mdash; Find refillable encounters</h2>
        <p className="endpoint">
          <code>GET /tenants/refills/staff/encounters?patientId=&hellip;</code>
        </p>
        <form onSubmit={fetchEncounters}>
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
              UUID of the patient. Maps to the <code>patientId</code> query param on{' '}
              <code>GET /tenants/refills/staff/encounters</code>.
            </p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={encLoading}>
            {encLoading ? 'Fetching…' : 'Find Eligible Encounters'}
          </button>
        </form>

        {encError && <div className="error-box">{encError}</div>}

        {encounters !== null && (
          encounters.length === 0 ? (
            <div className="warning-box" style={{ marginTop: 16 }}>
              <strong>No refillable encounters found for this patient.</strong>
              <p style={{ marginTop: 8, marginBottom: 4 }}>
                The Wizlo API only returns encounters that satisfy <em>all</em> of these:
              </p>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>Encounter status is <code>completed</code> (not <code>awaiting</code>, <code>pending</code>, or <code>cancelled</code>)</li>
                <li>At least one treatment is marked <code>indicated</code> by the reviewer</li>
                <li>That treatment has <code>remainingRefills &gt; 0</code> on its prescription</li>
              </ul>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Confirm via <code>GET /encounters/{'{id}'}</code> on this patient that the status field is{' '}
                <code>completed</code>.
              </p>
            </div>
          ) : (
            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>GFE</th>
                    <th>Status</th>
                    <th>Completed</th>
                    <th>Indicated</th>
                    <th>Refillable</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {encounters.map((e) => (
                    <tr
                      key={e.id}
                      className={`clickable ${selectedEncounterId === String(e.id) ? 'selected' : ''}`}
                      onClick={() => fetchTreatments(e.id)}
                    >
                      <td className="mono">{e.id}</td>
                      <td className="mono">{e.gfeId ?? '—'}</td>
                      <td>{e.status ?? '—'}</td>
                      <td>{e.completedAt ? e.completedAt.slice(0, 10) : '—'}</td>
                      <td>{e.indicatedTreatmentsCount ?? 0}</td>
                      <td>{e.refillableTreatmentsCount ?? 0}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            fetchTreatments(e.id);
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {encountersRaw !== null && (
          <div className="result-box">
            <pre>{JSON.stringify(encountersRaw, null, 2)}</pre>
          </div>
        )}
      </div>

      {selectedEncounterId && (
        <div className="card">
          <h2>Step 1b &mdash; Treatments in encounter {selectedEncounterId}</h2>
          <p className="endpoint">
            <code>GET /tenants/refills/staff/encounter/{selectedEncounterId}/treatments</code>
          </p>

          {txLoading && <p className="empty-state">Loading treatments…</p>}
          {txError && <div className="error-box">{txError}</div>}

          {treatments && treatments.length > 0 && (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Treatment</th>
                      <th>Qty</th>
                      <th>Remaining</th>
                      <th>Can Refill Now?</th>
                      <th>Reason</th>
                      <th>encounterTreatmentId</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatments.map((t) => {
                      const info = t.refillInfo;
                      const can = !!info?.canRefillNow && (info?.remainingRefills ?? 0) > 0;
                      return (
                        <tr key={t.encounterTreatmentId}>
                          <td>{t.treatment?.name ?? '—'}</td>
                          <td>{t.quantity ?? '—'}</td>
                          <td>{info?.remainingRefills ?? 0}</td>
                          <td>
                            <span className={`badge ${can ? 'badge-green' : 'badge-red'}`}>
                              {can ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: '#718096' }}>
                            {can
                              ? '—'
                              : info?.statusMessage ??
                                info?.reason ??
                                (info?.remainingRefills === 0
                                  ? 'no_refills_remaining'
                                  : 'cannot_refill_now')}
                          </td>
                          <td className="mono" style={{ fontSize: 11 }}>
                            {t.encounterTreatmentId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {refillableIds.length > 0 ? (
                <div className="success-box">
                  <strong>{refillableIds.length}</strong> treatment(s) ready to refill. &nbsp;
                  <Link
                    href={`/create-refill?patientId=${encodeURIComponent(
                      patientId,
                    )}&ids=${encodeURIComponent(refillableIds.join(','))}`}
                  >
                    → Continue to step 2
                  </Link>
                </div>
              ) : (
                <div className="warning-box">
                  No treatments in this encounter can be refilled right now &mdash; see the{' '}
                  <a href={EDGECASES_URL} target="_blank" rel="noreferrer">
                    edge-cases sample
                  </a>{' '}
                  for how to surface this in your UI.
                </div>
              )}
            </>
          )}

          {treatmentsRaw !== null && (
            <div className="result-box">
              <pre>{JSON.stringify(treatmentsRaw, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
