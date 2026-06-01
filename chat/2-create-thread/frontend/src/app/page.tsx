'use client';
import { useState } from 'react';
import { createThread, type CreateThreadResponse } from '@/lib/api';

export default function CreateThreadPage() {
  const [encounterId, setEncounterId] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateThreadResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await createThread(encounterId.trim(), patientEmail.trim());
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = encounterId.trim() && patientEmail.trim() && !loading;

  return (
    <div className="container">
      <h1>Create Chat Thread</h1>
      <p className="subtitle">
        Open (or re-open) a patient chat thread for a specific encounter. Creation is
        idempotent per encounter — if a thread already exists, the same one is returned.
      </p>

      <div className="card">
        <span className="badge">POST /chats-v2/encounter-thread/patient</span>

        <div className="form-group">
          <label>Patient Email *</label>
          <input
            type="email"
            value={patientEmail}
            onChange={e => setPatientEmail(e.target.value)}
            placeholder="patient@example.com"
          />
          <p className="hint">
            The patient who owns the encounter. The backend exchanges this for a user-scoped
            Wizlo token via <code>POST /oauth/user-token</code> — Wizlo&apos;s patient endpoints
            verify <code>encounter.patientId</code> matches the token subject.
          </p>
        </div>

        <div className="form-group">
          <label>Encounter ID *</label>
          <input
            type="text"
            value={encounterId}
            onChange={e => setEncounterId(e.target.value)}
            placeholder="EA00000077"
          />
          <p className="hint">The encounter GFE ID. A thread is always tied to exactly one encounter.</p>
        </div>

        <div className="btn-row">
          <button className="btn btn-success" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Creating...' : 'Create / Open Thread'}
          </button>
        </div>

        {result && (
          <>
            <div className="result-box" style={{ marginBottom: 12 }}>
              <strong>{result.isNew ? '✓ New thread created' : 'ℹ Existing thread returned'}</strong>
              {' — '}status <span className={`pill pill-${result.status}`}>{result.status}</span>
              {result.type && <> · type <span className={`pill pill-${result.type}`}>{result.type}</span></>}
            </div>
            <div className="result-box">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </>
        )}
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
