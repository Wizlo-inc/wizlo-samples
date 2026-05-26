'use client';
import { useState } from 'react';
import { updateAppointmentStatus, type AppointmentStatus } from '@/lib/api';

const STATUSES: { value: AppointmentStatus; label: string; description: string }[] = [
  { value: 'checked_in',  label: 'checked_in',  description: 'Patient has arrived at the clinic' },
  { value: 'in_progress', label: 'in_progress',  description: 'Appointment is currently underway' },
  { value: 'completed',   label: 'completed',    description: 'Appointment finished successfully' },
  { value: 'cancelled',   label: 'cancelled',    description: 'Appointment was cancelled' },
  { value: 'no_show',     label: 'no_show',      description: 'Patient did not attend' },
];

export default function UpdateAppointmentStatusPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('checked_in');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await updateAppointmentStatus(appointmentId, status);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Update Appointment Status</h1>
      <p className="subtitle">
        Move an appointment through its lifecycle by updating its status via the Wizlo API.
      </p>

      <div className="status-map">
        <strong>Status lifecycle</strong>
        <ul>
          <li><code>scheduled</code> → <code>checked_in</code> → <code>in_progress</code> → <code>completed</code></li>
          <li>Any status → <code>cancelled</code> or <code>no_show</code></li>
          <li><code>checked_out</code> does not exist — use <code>in_progress</code> instead</li>
        </ul>
      </div>

      <div className="card">
        <span className="badge">PATCH /appointments/:id/status</span>

        <div className="form-group">
          <label>Appointment ID *</label>
          <input
            type="text"
            value={appointmentId}
            onChange={e => {
              setAppointmentId(e.target.value);
              setResult(null);
              setError('');
            }}
            placeholder="UUID — e.g. 550e8400-e29b-41d4-a716-446655440000"
          />
        </div>

        <div className="form-group">
          <label>New Status *</label>
          <select value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)}>
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label} — {s.description}
              </option>
            ))}
          </select>
        </div>

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !appointmentId}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>

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
