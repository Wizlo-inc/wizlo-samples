'use client';
import { useState } from 'react';
import { createAppointment, type CreateAppointmentPayload } from '@/lib/api';

export default function CreateAppointmentPage() {
  const [form, setForm] = useState({
    clinicId: '',
    patientId: '',
    providerId: '',
    careType: 'INPERSON' as 'INPERSON' | 'ENCOUNTER',
    treatmentIds: '',
    shareVia: 'EMAIL' as 'EMAIL' | 'SMS' | 'EMAILSMS',
    scheduledDay: '',
    scheduledTime: '',
    scheduledTimeZone: 'America/New_York',
    slotDurationMinutes: '30',
    notes: '',
    reviewerId: '',
    shouldCreateEncounter: true,
    // payment
    amount: '',
    paymentType: '' as '' | 'full_payment' | 'split_payment' | 'partial_payment',
    txMethodType: '' as '' | 'card' | 'cash' | 'bank',
    txAmount: '',
    userPaymentMethodId: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const payload: CreateAppointmentPayload = {
        clinicId: form.clinicId,
        patientId: form.patientId,
        providerId: form.providerId,
        careType: form.careType,
        treatmentIds: form.treatmentIds.split(',').map(s => s.trim()).filter(Boolean),
        shareVia: form.shareVia,
        scheduledDay: form.scheduledDay,
        scheduledTime: form.scheduledTime ? `${form.scheduledTime}:00` : '',
        scheduledTimeZone: form.scheduledTimeZone,
        shouldCreateEncounter: form.shouldCreateEncounter,
        formsIds: [],
      };
      if (form.slotDurationMinutes) payload.slotDurationMinutes = parseInt(form.slotDurationMinutes, 10);
      if (form.notes) payload.notes = form.notes;
      if (form.reviewerId) payload.reviewerId = form.reviewerId;
      if (form.amount) {
        payload.amount = parseFloat(form.amount);
        if (form.paymentType) payload.paymentType = form.paymentType;
        if (form.txMethodType) {
          payload.transaction = {
            methodType: form.txMethodType,
            amount: parseFloat(form.txAmount) || parseFloat(form.amount),
          };
          if (form.userPaymentMethodId) payload.transaction.userPaymentMethodId = form.userPaymentMethodId;
        }
      }
      const data = await createAppointment(payload);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    form.clinicId && form.patientId && form.providerId &&
    form.treatmentIds && form.scheduledDay && form.scheduledTime &&
    form.scheduledTimeZone;

  return (
    <div className="container">
      <h1>Create Appointment</h1>
      <p className="subtitle">
        Schedule a new appointment for a patient with a provider at a clinic via the Wizlo API.
      </p>

      <div className="card">
        <span className="badge">POST /appointments</span>

        <div className="form-row">
          <div className="form-group">
            <label>Clinic ID *</label>
            <input type="text" value={form.clinicId} onChange={e => set('clinicId', e.target.value)} placeholder="UUID" />
          </div>
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="text" value={form.patientId} onChange={e => set('patientId', e.target.value)} placeholder="UUID" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Provider ID *</label>
            <input type="text" value={form.providerId} onChange={e => set('providerId', e.target.value)} placeholder="UUID" />
          </div>
          <div className="form-group">
            <label>Care Type *</label>
            <select value={form.careType} onChange={e => set('careType', e.target.value as 'INPERSON' | 'ENCOUNTER')}>
              <option value="INPERSON">INPERSON — Physical visit</option>
              <option value="ENCOUNTER">ENCOUNTER — Virtual consultation</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Treatment IDs *</label>
          <input type="text" value={form.treatmentIds} onChange={e => set('treatmentIds', e.target.value)} placeholder="UUID1, UUID2, ..." />
          <p className="hint">Comma-separated list of treatment UUIDs.</p>
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
            <label>Slot Duration (minutes)</label>
            <input type="number" value={form.slotDurationMinutes} onChange={e => set('slotDurationMinutes', e.target.value)} min="1" placeholder="30" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Share Via *</label>
            <select value={form.shareVia} onChange={e => set('shareVia', e.target.value as 'EMAIL' | 'SMS' | 'EMAILSMS')}>
              <option value="EMAIL">EMAIL</option>
              <option value="SMS">SMS</option>
              <option value="EMAILSMS">EMAIL + SMS</option>
            </select>
          </div>
          <div className="form-group">
            <label>Reviewer ID</label>
            <input type="text" value={form.reviewerId} onChange={e => set('reviewerId', e.target.value)} placeholder="UUID (optional)" />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional appointment notes..." />
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="shouldCreateEncounter"
              checked={form.shouldCreateEncounter}
              onChange={e => set('shouldCreateEncounter', e.target.checked)}
            />
            <label htmlFor="shouldCreateEncounter">Create encounter automatically (shouldCreateEncounter)</label>
          </div>
          <p className="hint">Defaults to true. Uncheck to schedule appointment without creating a linked encounter.</p>
        </div>

        <div className="section-title">Payment (optional)</div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" step="0.01" placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Payment Type</label>
            <select value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
              <option value="">— none —</option>
              <option value="full_payment">Full Payment</option>
              <option value="split_payment">Split Payment</option>
              <option value="partial_payment">Partial Payment</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Transaction Method</label>
            <select value={form.txMethodType} onChange={e => set('txMethodType', e.target.value)}>
              <option value="">— none —</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Method ID</label>
            <input type="text" value={form.userPaymentMethodId} onChange={e => set('userPaymentMethodId', e.target.value)} placeholder="userPaymentMethodId (UUID)" />
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: '8px' }}>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? 'Creating...' : 'Create Appointment'}
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
