'use client';
import { useState } from 'react';
import { createEncounter, type EncounterScenario } from '@/lib/api';

const SCENARIOS: { value: EncounterScenario; label: string; description: string }[] = [
  {
    value: 'standard-sync',
    label: 'Standard Synchronous',
    description: 'Live review — reviewer assigned immediately, appointment booked.',
  },
  {
    value: 'standard-async',
    label: 'Standard Asynchronous',
    description: 'Async review — patient submits info, reviewer reviews later. No appointment.',
  },
  {
    value: 'hrt',
    label: 'HRT Encounter',
    description: 'Hormone Replacement Therapy encounter. Treatment IDs are optional.',
  },
  {
    value: 'provider-network',
    label: 'Provider Network',
    description: 'Routes to an external provider network. Requires Provider Network Tenant ID.',
  },
  {
    value: 'with-forms',
    label: 'With Intake Forms',
    description: 'Sends form invitations to the patient via email/SMS on creation.',
  },
  {
    value: 'skip-order',
    label: 'Skip Order Creation',
    description: 'Creates encounter without auto-generating an order (order created manually later).',
  },
];

export default function EncountersPage() {
  const [scenario, setScenario] = useState<EncounterScenario>('standard-sync');
  const [patientId, setPatientId] = useState('49f623c9-0fc3-4e66-9b5e-56c955a71e43');
  const [formIds, setFormIds] = useState('');
  const [treatmentIds, setTreatmentIds] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [scheduledDay, setScheduledDay] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [providerNetworkTenantId, setProviderNetworkTenantId] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedScenario = SCENARIOS.find(s => s.value === scenario)!;

  const showForms = scenario === 'with-forms';
  const showScheduling = ['standard-sync', 'hrt', 'with-forms', 'skip-order'].includes(scenario);
  const showProviderNetwork = scenario === 'provider-network';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await createEncounter({
        patientId,
        scenario,
        formIds: formIds ? formIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        treatmentIds: treatmentIds ? treatmentIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        additionalNotes: additionalNotes || undefined,
        scheduledDay: scheduledDay || undefined,
        scheduledTime: scheduledTime || undefined,
        providerNetworkTenantId: providerNetworkTenantId || undefined,
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

          {/* ── Scenario selector ── */}
          <div className="form-group">
            <label>Encounter Scenario *</label>
            <select value={scenario} onChange={e => setScenario(e.target.value as EncounterScenario)}>
              {SCENARIOS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="hint">{selectedScenario.description}</p>
          </div>

          {/* ── Patient ID (always shown) ── */}
          <div className="form-group">
            <label>Patient ID *</label>
            <input
              type="text"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              required
            />
          </div>

          {/* ── Treatment IDs (always shown, optional for HRT) ── */}
          <div className="form-group">
            <label>Treatment IDs {scenario === 'hrt' ? '(optional for HRT)' : ''}</label>
            <input
              type="text"
              value={treatmentIds}
              onChange={e => setTreatmentIds(e.target.value)}
              placeholder="treatment-uuid-1, treatment-uuid-2"
            />
            <p className="hint">Comma-separated UUIDs</p>
          </div>

          {/* ── Form IDs (only for with-forms scenario) ── */}
          {showForms && (
            <div className="form-group">
              <label>Form IDs *</label>
              <input
                type="text"
                value={formIds}
                onChange={e => setFormIds(e.target.value)}
                placeholder="form-template-uuid-1, form-template-uuid-2"
                required={showForms}
              />
              <p className="hint">Comma-separated form template UUIDs — invitations sent to patient via email/SMS</p>
            </div>
          )}

          {/* ── Provider Network Tenant ID (only for provider-network scenario) ── */}
          {showProviderNetwork && (
            <div className="form-group">
              <label>Provider Network Tenant ID *</label>
              <input
                type="text"
                value={providerNetworkTenantId}
                onChange={e => setProviderNetworkTenantId(e.target.value)}
                placeholder="provider-network-tenant-uuid"
                required={showProviderNetwork}
              />
              <p className="hint">UUID of the external provider network tenant</p>
            </div>
          )}

          {/* ── Additional Notes (always shown) ── */}
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          {/* ── Scheduling (sync scenarios only) ── */}
          {showScheduling && (
            <div className="row">
              <div className="form-group">
                <label>Scheduled Day</label>
                <input
                  type="date"
                  value={scheduledDay}
                  onChange={e => setScheduledDay(e.target.value)}
                />
                <p className="hint">Defaults to 7 days from now</p>
              </div>
              <div className="form-group">
                <label>Scheduled Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                />
                <p className="hint">Defaults to 09:00:00</p>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : `Create ${selectedScenario.label} Encounter`}
          </button>
        </form>

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
