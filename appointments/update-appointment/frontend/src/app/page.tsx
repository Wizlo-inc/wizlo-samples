'use client';
import { useState } from 'react';
import { updateAppointment, type UpdateAppointmentPayload } from '@/lib/api';

export default function UpdateAppointmentPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [form, setForm] = useState({
    scheduledDay: '',
    scheduledTime: '',
    scheduledTimeZone: 'America/New_York',
    shareVia: 'email' as 'email' | 'sms',
    formsIds: '',
    slotDurationMinutes: '',
    notes: '',
    providerId: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const payload: UpdateAppointmentPayload = {
        scheduledDay: form.scheduledDay,
        scheduledTime: form.scheduledTime ? `${form.scheduledTime}:00` : '',
        scheduledTimeZone: form.scheduledTimeZone,
        shareVia: form.shareVia,
      };
      payload.formsIds = form.formsIds ? form.formsIds.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (form.slotDurationMinutes) payload.slotDurationMinutes = parseInt(form.slotDurationMinutes, 10);
      if (form.notes) payload.notes = form.notes;
      if (form.providerId) payload.providerId = form.providerId;

      const data = await updateAppointment(appointmentId, payload);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    appointmentId && form.scheduledDay && form.scheduledTime && form.scheduledTimeZone;

  return (
    <div className="container">
      <h1>Update Appointment</h1>
      <p className="subtitle">
        Reschedule or update an existing appointment&apos;s time, provider, and delivery preferences via the Wizlo API.
      </p>

      <div className="card">
        <span className="badge">PUT /appointments/:id</span>

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

        <div className="form-row">
          <div className="form-group">
            <label>Scheduled Day *</label>
            <input type="date" value={form.scheduledDay} onChange={e => set('scheduledDay', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Scheduled Time *</label>
            <input type="time" value={form.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} />
            <p className="hint">Sent as HH:mm:ss to the API.</p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Time Zone *</label>
            <input type="text" value={form.scheduledTimeZone} onChange={e => set('scheduledTimeZone', e.target.value)} placeholder="America/New_York" />
            <p className="hint">IANA timezone identifier.</p>
          </div>
          <div className="form-group">
            <label>Share Via *</label>
            <select value={form.shareVia} onChange={e => set('shareVia', e.target.value)}>
              <option value="email">email</option>
              <option value="sms">sms</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Slot Duration (minutes)</label>
            <input type="number" value={form.slotDurationMinutes} onChange={e => set('slotDurationMinutes', e.target.value)} min="1" placeholder="30" />
          </div>
          <div className="form-group">
            <label>Provider ID</label>
            <input type="text" value={form.providerId} onChange={e => set('providerId', e.target.value)} placeholder="UUID (optional)" />
          </div>
        </div>

        <div className="form-group">
          <label>Forms IDs</label>
          <input type="text" value={form.formsIds} onChange={e => set('formsIds', e.target.value)} placeholder="UUID1, UUID2, ... (optional)" />
          <p className="hint">Comma-separated list of form UUIDs to attach.</p>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional appointment notes..." />
        </div>

        <div className="btn-row" style={{ marginTop: '8px' }}>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? 'Updating...' : 'Update Appointment'}
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
