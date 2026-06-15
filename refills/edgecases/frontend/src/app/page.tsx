/**
 * Module:    Refills / Edge Cases
 * Workflow:  Failure-mode handling
 * File:      app/page.tsx
 * Author:    Abhay Panchal
 * Date:      2026-05-19
 *
 * Two diagnostic flows you must handle in production:
 *
 *   A) no_refills_remaining       → remainingRefills = 0. Recoverable only by
 *                                    creating a new encounter.
 *   B) next_refill_in_x_days      → canRefillNow = false but remainingRefills > 0.
 *                                    Patient waits, or staff bypasses with
 *                                    bypassDaysOfSupply: true.
 *
 * Both flows scan the patient's encounters for a matching treatment so you can
 * exercise the real failure mode, not just read the docs.
 */
'use client';

import { useState } from 'react';
import {
  createRefill,
  getEligibleEncounters,
  getEncounterTreatments,
  type Treatment,
} from '@/lib/api';

type Match = { encounterId: number; treatment: Treatment } | null;
type ScanStats = { encountersScanned: number; treatmentsScanned: number };
type ScanResult = { match: Match; stats: ScanStats };

async function findMatching(
  patientId: string,
  predicate: (t: Treatment) => boolean,
): Promise<ScanResult> {
  const encs = await getEligibleEncounters(patientId);
  const list = encs.data ?? [];
  let treatmentsScanned = 0;
  for (const e of list) {
    const tx = await getEncounterTreatments(String(e.id));
    const treatments = tx.data?.treatments ?? [];
    treatmentsScanned += treatments.length;
    const hit = treatments.find(predicate);
    if (hit) {
      return {
        match: { encounterId: e.id, treatment: hit },
        stats: { encountersScanned: list.length, treatmentsScanned },
      };
    }
  }
  return {
    match: null,
    stats: { encountersScanned: list.length, treatmentsScanned },
  };
}

function buildEmptyMsg(stats: ScanStats, condition: string): string {
  if (stats.encountersScanned === 0) {
    return (
      'No refillable encounters were returned for this patient. Confirm the patient has at least ' +
      'one encounter in `completed` status with treatments marked `indicated`.'
    );
  }
  if (stats.treatmentsScanned === 0) {
    return (
      `Scanned ${stats.encountersScanned} encounter(s) but none contained any treatments to ` +
      'inspect.'
    );
  }
  return (
    `Scanned ${stats.encountersScanned} encounter(s) / ${stats.treatmentsScanned} treatment(s). ` +
    `None matched the condition: ${condition}. This is the happy path — the patient currently ` +
    'has no refills in this failure state. To demo this edge case you need test data that ' +
    'reproduces the condition (see the eligibility reason codes table below).'
  );
}

export default function EdgeCasesPage() {
  const [patientId, setPatientId] = useState('49f623c9-0fc3-4e66-9b5e-56c955a71e43');

  const [noRefillsMatch, setNoRefillsMatch] = useState<Match>(null);
  const [noRefillsScanning, setNoRefillsScanning] = useState(false);
  const [noRefillsScanMsg, setNoRefillsScanMsg] = useState('');
  const [noRefillsAttempt, setNoRefillsAttempt] = useState<{ error?: string; ok?: unknown } | null>(
    null,
  );

  const [windowMatch, setWindowMatch] = useState<Match>(null);
  const [windowScanning, setWindowScanning] = useState(false);
  const [windowScanMsg, setWindowScanMsg] = useState('');
  const [overrideResult, setOverrideResult] = useState<{ error?: string; ok?: unknown } | null>(
    null,
  );
  const [overrideLoading, setOverrideLoading] = useState(false);

  const scanNoRefills = async () => {
    setNoRefillsScanning(true);
    setNoRefillsMatch(null);
    setNoRefillsScanMsg('');
    setNoRefillsAttempt(null);
    try {
      const { match, stats } = await findMatching(
        patientId.trim(),
        (t) => (t.refillInfo?.remainingRefills ?? 0) === 0,
      );
      if (match) {
        setNoRefillsMatch(match);
      } else {
        setNoRefillsScanMsg(buildEmptyMsg(stats, 'remainingRefills = 0'));
      }
    } catch (err) {
      setNoRefillsScanMsg(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setNoRefillsScanning(false);
    }
  };

  const attemptNoRefills = async () => {
    if (!noRefillsMatch) return;
    setNoRefillsAttempt(null);
    try {
      const res = await createRefill({
        patientId: patientId.trim(),
        encounterTreatmentIds: [noRefillsMatch.treatment.encounterTreatmentId],
      });
      setNoRefillsAttempt({ ok: res });
    } catch (err) {
      setNoRefillsAttempt({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const scanWindow = async () => {
    setWindowScanning(true);
    setWindowMatch(null);
    setWindowScanMsg('');
    setOverrideResult(null);
    try {
      const { match, stats } = await findMatching(
        patientId.trim(),
        (t) =>
          (t.refillInfo?.remainingRefills ?? 0) > 0 &&
          t.refillInfo?.canRefillNow === false,
      );
      if (match) {
        setWindowMatch(match);
      } else {
        setWindowScanMsg(
          buildEmptyMsg(stats, 'remainingRefills > 0 AND canRefillNow = false'),
        );
      }
    } catch (err) {
      setWindowScanMsg(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setWindowScanning(false);
    }
  };

  const overrideAttempt = async () => {
    if (!windowMatch) return;
    setOverrideLoading(true);
    setOverrideResult(null);
    try {
      const res = await createRefill({
        patientId: patientId.trim(),
        encounterTreatmentIds: [windowMatch.treatment.encounterTreatmentId],
        bypassDaysOfSupply: true,
      });
      setOverrideResult({ ok: res });
    } catch (err) {
      setOverrideResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Refills — Edge Cases</h1>
      <p className="subtitle">
        Two refill failure modes every integration has to handle. Both come back as{' '}
        <code>400 REFILL_NOT_ELIGIBLE</code> from the create endpoint &mdash; but you should
        detect them at the eligibility step and steer the UI before the API call.
      </p>

      <div className="card">
        <h2>Patient</h2>
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
            UUID of the patient to scan. Both edge-case scans use the same{' '}
            <code>GET /tenants/refills/staff/encounters?patientId=…</code> →{' '}
            <code>GET /tenants/refills/staff/encounter/:id/treatments</code> pair, then attempt{' '}
            <code>POST /tenants/refills/staff/create</code> to reproduce the 400.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Edge case A &mdash; no refills remaining</h2>
        <p className="endpoint">
          <code>refillInfo.remainingRefills = 0</code> &mdash; not recoverable via the refill API.
        </p>
        <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 14 }}>
          The patient needs a brand-new encounter for a fresh prescription. Surface a clear CTA
          in your UI &mdash; do <strong>not</strong> call the create endpoint, it will{' '}
          <code>400 REFILL_NOT_ELIGIBLE</code> with <code>reason: no_refills_remaining</code>.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={scanNoRefills}
          disabled={noRefillsScanning}
        >
          {noRefillsScanning ? 'Scanning…' : 'Scan for treatment with 0 refills'}
        </button>

        {noRefillsScanMsg && <div className="warning-box">{noRefillsScanMsg}</div>}

        {noRefillsMatch && (
          <div className="result-box">
            <div>
              Found exhausted treatment in encounter <strong>{noRefillsMatch.encounterId}</strong>:
            </div>
            <pre style={{ marginTop: 8 }}>
              {JSON.stringify(
                {
                  name: noRefillsMatch.treatment.treatment?.name,
                  encounterTreatmentId: noRefillsMatch.treatment.encounterTreatmentId,
                  remainingRefills: noRefillsMatch.treatment.refillInfo?.remainingRefills,
                },
                null,
                2,
              )}
            </pre>
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginTop: 12 }}
              onClick={attemptNoRefills}
            >
              Attempt create-refill anyway (expected to fail)
            </button>
            {noRefillsAttempt?.error && (
              <>
                <div className="error-box" style={{ marginTop: 12 }}>
                  ✓ Got the expected eligibility failure
                </div>
                <div className="result-box">
                  <pre>{noRefillsAttempt.error}</pre>
                </div>
              </>
            )}
            {!!noRefillsAttempt?.ok && (
              <>
                <div className="warning-box" style={{ marginTop: 12 }}>
                  Unexpected success — UAT data may have refills after all.
                </div>
                <div className="result-box">
                  <pre>{JSON.stringify(noRefillsAttempt.ok, null, 2)}</pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Edge case B &mdash; cannot refill now (days-of-supply)</h2>
        <p className="endpoint">
          <code>canRefillNow = false</code> while <code>remainingRefills &gt; 0</code>.
        </p>
        <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 14 }}>
          The patient still has refills but is too early. Default UX &mdash; show{' '}
          <code>daysUntilNextRefill</code> and disable the refill button. Staff can override the
          days-of-supply check with <code>bypassDaysOfSupply: true</code>. Remaining refills and
          expiry are still enforced.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={scanWindow}
          disabled={windowScanning}
        >
          {windowScanning ? 'Scanning…' : 'Scan for in-window treatment'}
        </button>

        {windowScanMsg && <div className="warning-box">{windowScanMsg}</div>}

        {windowMatch && (
          <div className="result-box">
            <div>
              Found in-window treatment in encounter <strong>{windowMatch.encounterId}</strong>:
            </div>
            <pre style={{ marginTop: 8 }}>
              {JSON.stringify(
                {
                  name: windowMatch.treatment.treatment?.name,
                  encounterTreatmentId: windowMatch.treatment.encounterTreatmentId,
                  remainingRefills: windowMatch.treatment.refillInfo?.remainingRefills,
                  canRefillNow: windowMatch.treatment.refillInfo?.canRefillNow,
                  daysUntilNextRefill: windowMatch.treatment.refillInfo?.daysUntilNextRefill,
                  reason: windowMatch.treatment.refillInfo?.reason,
                },
                null,
                2,
              )}
            </pre>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={overrideAttempt}
              disabled={overrideLoading}
            >
              {overrideLoading ? 'Submitting…' : 'Staff bypass — submit with bypassDaysOfSupply'}
            </button>
            {overrideResult?.error && (
              <>
                <div className="error-box" style={{ marginTop: 12 }}>
                  Override rejected.
                </div>
                <div className="result-box">
                  <pre>{overrideResult.error}</pre>
                </div>
              </>
            )}
            {!!overrideResult?.ok && (
              <>
                <div className="success-box" style={{ marginTop: 12 }}>
                  ✓ Override accepted.
                </div>
                <div className="result-box">
                  <pre>{JSON.stringify(overrideResult.ok, null, 2)}</pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Eligibility reason codes</h3>
        <p style={{ marginBottom: 12, fontSize: 14, color: '#4a5568' }}>
          <code>refillInfo.reason</code> is set to the treatment&apos;s eligibility{' '}
          <code>status</code> only when <code>canRefillNow === false</code> (it&apos;s omitted
          when the treatment is refillable). Only two values can appear:
        </p>
        <table>
          <thead>
            <tr>
              <th>reason</th>
              <th>Meaning</th>
              <th>Bypass via bypassDaysOfSupply?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">no_refills_remaining</td>
              <td>remainingRefills === 0, or prescription past its validity date</td>
              <td><span className="badge badge-red">No</span></td>
            </tr>
            <tr>
              <td className="mono">next_refill_in_x_days</td>
              <td>Has refills, but days-of-supply window not yet elapsed</td>
              <td><span className="badge badge-green">Yes (staff only)</span></td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 13, color: '#718096' }}>
          A refillable treatment reports <code>status: refill_required</code> with{' '}
          <code>reason</code> omitted. Treatments never marked <code>indicated</code> don&apos;t
          appear here at all — the staff endpoint only returns indicated treatments.
        </p>
        <p style={{ marginTop: 14, fontSize: 14, color: '#4a5568' }}>
          Map these to UI messages and recovery CTAs before the user hits the API. The main happy-
          path workflow lives at{' '}
          <a href="http://localhost:3013" target="_blank" rel="noreferrer">
            http://localhost:3013
          </a>
          .
        </p>
      </div>
    </div>
  );
}
