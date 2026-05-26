'use client';
import { useState } from 'react';
import { rescheduleAppointment, type RescheduleAppointmentPayload } from '@/lib/api';

export default function RescheduleAppointmentPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [form, setForm] = useState({
    scheduledDay: '',
    scheduledTime: '',
    scheduledTimeZone: 'America/New_York',
    slotDurationMinutes: '30',
    rescheduleReason: '',
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
      const payload: RescheduleAppointmentPayload = {
        scheduledDay: form.scheduledDay,
        scheduledTime: form.scheduledTime ? `${form.scheduledTime}:00` : '',
        scheduledTimeZone: form.scheduledTimeZone,
        slotDurationMinutes: parseInt(form.slotDurationMinutes, 10),
      };
      if (form.rescheduleReason) payload.rescheduleReason = form.rescheduleReason;

      const data = await rescheduleAppointment(appointmentId, payload);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    appointmentId && form.scheduledDay && form.scheduledTime &&
    form.scheduledTimeZone && form.slotDurationMinutes;

  return (
    <div className="container">
      <h1>Reschedule Appointment</h1>
      <p className="subtitle">
        Move an existing appointment to a new time. Wizlo creates a new appointment and links it
        to the original via <code>rescheduledFrom</code> / <code>rescheduledTo</code>.
      </p>

      <div className="info-box">
        <strong>This is not the same as Update Appointment (PUT)</strong>
        Rescheduling calls <code>POST /appointments/{'{id}'}/reschedule</code> — a dedicated endpoint
        that atomically creates a new appointment, marks the old one as <code>rescheduled</code>,
        and sets bidirectional linkage fields. Use this whenever the patient is moving to a different time slot.
      </div>

      <div className="card">
        <span className="badge">POST /appointments/:id/reschedule</span>

        <div className="form-group">
          <label>Original Appointment ID *</label>
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
          <p className="hint">The UUID of the appointment to reschedule. It will be marked as <code>rescheduled</code>.</p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>New Scheduled Day *</label>
            <input type="date" value={form.scheduledDay} onChange={e => set('scheduledDay', e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Scheduled Time *</label>
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
            <label>Slot Duration (minutes) *</label>
            <input type="number" value={form.slotDurationMinutes} onChange={e => set('slotDurationMinutes', e.target.value)} min="1" placeholder="30" />
            <p className="hint">Required — minimum 1 minute.</p>
          </div>
        </div>

        <div className="form-group">
          <label>Reschedule Reason</label>
          <textarea
            value={form.rescheduleReason}
            onChange={e => set('rescheduleReason', e.target.value)}
            placeholder="Optional — e.g. Patient requested earlier slot"
          />
        </div>

        <div className="btn-row" style={{ marginTop: '8px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
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
