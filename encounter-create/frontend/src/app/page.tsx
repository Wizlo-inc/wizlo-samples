'use client';
import { useState } from 'react';
import { createEncounter } from '@/lib/api';

export default function EncountersPage() {
  const [patientId, setPatientId] = useState('49f623c9-0fc3-4e66-9b5e-56c955a71e43');
  const [formIds, setFormIds] = useState('');
  const [treatmentIds, setTreatmentIds] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [scheduledDay, setScheduledDay] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await createEncounter({
        patientId,
        formIds: formIds ? formIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        treatmentIds: treatmentIds ? treatmentIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        additionalNotes: additionalNotes || undefined,
        scheduledDay: scheduledDay || undefined,
        scheduledTime: scheduledTime || undefined,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Wizlo Encounters</h1>
      <p className="subtitle">Create a medical encounter in Wizlo for a patient.</p>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Form IDs</label>
            <input type="text" value={formIds} onChange={e => setFormIds(e.target.value)} placeholder="form-1, form-2" />
            <p className="hint">Comma-separated</p>
          </div>
          <div className="form-group">
            <label>Treatment IDs</label>
            <input type="text" value={treatmentIds} onChange={e => setTreatmentIds(e.target.value)} placeholder="treatment-1, treatment-2" />
            <p className="hint">Comma-separated</p>
          </div>
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any additional notes..." />
          </div>
          <div className="row">
            <div className="form-group">
              <label>Scheduled Day</label>
              <input type="date" value={scheduledDay} onChange={e => setScheduledDay(e.target.value)} />
              <p className="hint">Defaults to 7 days from now</p>
            </div>
            <div className="form-group">
              <label>Scheduled Time</label>
              <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
              <p className="hint">Defaults to 09:00:00</p>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Encounter'}
          </button>
        </form>
        {result && (
          <div className="result-box">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
