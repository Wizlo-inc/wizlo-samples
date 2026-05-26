'use client';
import { useState } from 'react';
import { getEncounterStatus, cancelEncounter } from '@/lib/api';

const CANCELLABLE_STATUSES = ['awaiting', 'in_review', 'processing', 'missing_id'];

export default function CancelEncounterPage() {
  const [encounterId, setEncounterId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const isCancellable = status !== null && CANCELLABLE_STATUSES.includes(status.toLowerCase());

  const handleCheckStatus = async () => {
    if (!encounterId) return;
    setStatusLoading(true);
    setStatus(null);
    setResult(null);
    setError('');
    try {
      const data = await getEncounterStatus(parseInt(encounterId, 10));
      setStatus(data.status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!encounterId) return;
    setCancelLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await cancelEncounter(parseInt(encounterId, 10));
      setResult(data);
      setStatus(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Cancel Encounter</h1>
      <p className="subtitle">
        Check an encounter&apos;s current status, then cancel it if eligible. Only encounters in
        AWAITING, IN_REVIEW, PROCESSING, or MISSING_ID status can be cancelled.
      </p>
      <div className="card">
        <span className="badge">POST /encounters/:id/cancel</span>
        <div className="form-group">
          <label>Encounter ID *</label>
          <input
            type="number"
            value={encounterId}
            onChange={e => {
              setEncounterId(e.target.value);
              setStatus(null);
              setResult(null);
              setError('');
            }}
            placeholder="Enter integer encounter ID"
            min="1"
          />
          <p className="hint">Integer ID of the encounter to cancel.</p>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCheckStatus}
            disabled={statusLoading || !encounterId}
          >
            {statusLoading ? 'Checking...' : 'Check Status'}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCancel}
            disabled={cancelLoading || !isCancellable}
          >
            {cancelLoading ? 'Cancelling...' : 'Cancel Encounter'}
          </button>
        </div>

        {status !== null && (
          <div className="status-panel">
            <p>Current status:</p>
            <span className={`status-badge ${isCancellable ? 'cancellable' : 'not-cancellable'}`}>
              {status}
            </span>
            {!isCancellable && (
              <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#718096' }}>
                This encounter cannot be cancelled in its current status.
              </p>
            )}
          </div>
        )}

        {result !== null && (
          <div className="result-box">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
