'use client';
import { useState } from 'react';
import {
  getProviderSlots, getLabSlots,
  type ProviderSlotsResponse, type LabSlotsResponse,
} from '@/lib/api';

type SlotType = 'provider' | 'lab';

const fmtTime = (t: string) => {
  // Provider slots come as "HH:mm:ss"; lab slots as ISO timestamps.
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (d: string) => {
  const date = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
  return isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function AvailableSlotsPage() {
  const [type, setType] = useState<SlotType>('provider');

  // Shared
  const [patientEmail, setPatientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Provider
  const [encounterId, setEncounterId] = useState('');
  const [date, setDate] = useState('');
  const [provider, setProvider] = useState<ProviderSlotsResponse | null>(null);

  // Lab
  const [zipCode, setZipCode] = useState('');
  const [lab, setLab] = useState('quest');
  const [radius, setRadius] = useState('25');
  const [startDate, setStartDate] = useState('');
  const [labRes, setLabRes] = useState<LabSlotsResponse | null>(null);

  const switchType = (t: SlotType) => {
    setType(t);
    setError('');
  };

  const fetchProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setProvider(null);
    try {
      setProvider(await getProviderSlots({ patientEmail: patientEmail.trim(), encounterId: encounterId.trim(), date: date || undefined }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load provider slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setLabRes(null);
    try {
      setLabRes(await getLabSlots({ patientEmail: patientEmail.trim(), zipCode: zipCode.trim(), lab, radius, startDate: startDate || undefined }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load lab slots');
    } finally {
      setLoading(false);
    }
  };

  const providerDays = provider ? Object.entries(provider.slots) : [];

  return (
    <div className="container">
      <h1>Available Slots</h1>
      <p className="subtitle">
        The available-slots utility returns open appointment slots. Pick a <strong>type</strong>:
        <strong> provider</strong> telehealth slots (before scheduling a SYNC encounter) or
        <strong> lab</strong> PSC walk-in slots (during subscription enrollment, lab variants).
        Both are patient-scoped, so a patient email is required.
      </p>

      <div className="toggle">
        <button className={type === 'provider' ? 'active' : ''} onClick={() => switchType('provider')}>Provider</button>
        <button className={type === 'lab' ? 'active' : ''} onClick={() => switchType('lab')}>Lab (PSC)</button>
      </div>

      {/* ── PROVIDER ── */}
      {type === 'provider' && (
        <div className="card">
          <span className="badge">GET /available-slots?type=provider</span>
          <p className="hint" style={{ marginBottom: 16 }}>
            Proxies <code>GET /appointments/encounter/:encounterId/available-slots?date=YYYY-MM-DD</code> as the patient.
            Returns a 7-day window of provider-network telehealth slots.
          </p>
          <form onSubmit={fetchProvider}>
            <div className="form-group">
              <label>Patient Email *</label>
              <input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} placeholder="patient@example.com" required />
              <span className="hint">Used to mint a user-scoped token (POST /oauth/user-token).</span>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Encounter ID *</label>
                <input type="text" value={encounterId} onChange={e => setEncounterId(e.target.value)} placeholder="123" required />
                <span className="hint">A SYNC encounter awaiting an appointment (AWAITING_APPOINTMENT).</span>
              </div>
              <div className="form-group">
                <label>From Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <span className="hint">Defaults to today. Returns a 7-day window.</span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Loading slots…' : 'Get Provider Slots →'}
            </button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </div>
      )}

      {type === 'provider' && provider && (
        <div className="card">
          <h2>Provider slots</h2>
          <div className="info-box">
            Encounter <span className="mono">{provider.encounterId}</span> · timezone {provider.timezone}
          </div>
          {providerDays.length === 0 ? (
            <p className="empty-state">No open slots in this window.</p>
          ) : providerDays.map(([day, slots]) => (
            <div className="slot-group" key={day}>
              <h3>{fmtDate(day)}</h3>
              {slots.length === 0 ? <p className="hint">No slots.</p> : (
                <div className="slot-chips">
                  {slots.map((s, i) => (
                    <span className="slot-chip" key={i}>{fmtTime(s.start)} – {fmtTime(s.end)}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── LAB ── */}
      {type === 'lab' && (
        <div className="card">
          <span className="badge">GET /available-slots?type=lab</span>
          <p className="hint" style={{ marginBottom: 16 }}>
            Proxies <code>GET /tenants/patient-subscriptions/psc-locations?zipCode=…</code> as the patient.
            Returns walk-in PSC lab availability grouped by date and location.
          </p>
          <form onSubmit={fetchLab}>
            <div className="form-group">
              <label>Patient Email *</label>
              <input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} placeholder="patient@example.com" required />
            </div>
            <div className="row">
              <div className="form-group">
                <label>ZIP Code *</label>
                <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="85004 or 85004-1234" required />
                <span className="hint">5-digit (85004) or ZIP+4 (85004-1234).</span>
              </div>
              <div className="form-group">
                <label>Lab</label>
                <select value={lab} onChange={e => setLab(e.target.value)}>
                  <option value="quest">Quest</option>
                  <option value="labcorp">Labcorp</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Radius (miles)</label>
                <select value={radius} onChange={e => setRadius(e.target.value)}>
                  {['10', '20', '25', '50', '100'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Loading slots…' : 'Get Lab Slots →'}
            </button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </div>
      )}

      {type === 'lab' && labRes && (
        <div className="card">
          <h2>Lab (PSC) slots</h2>
          {labRes.timezone && <div className="info-box">Timezone {labRes.timezone}</div>}
          {(!labRes.availability || labRes.availability.length === 0) ? (
            <p className="empty-state">No PSC availability near this ZIP.</p>
          ) : labRes.availability.map((day, i) => (
            <div className="location-card" key={i}>
              <div className="loc-head">
                <span className="loc-name">{day.location?.name ?? 'PSC site'} · {fmtDate(day.date)}</span>
                {day.location && day.location.distance != null && (
                  <span className="loc-dist">{(day.location.distance / 1609).toFixed(1)} mi</span>
                )}
              </div>
              <div className="loc-addr">
                {[day.location?.address?.firstLine, day.location?.address?.city, day.location?.address?.state, day.location?.address?.zipCode].filter(Boolean).join(', ')}
                {' · site '}<span className="mono">{day.location?.code}</span>
              </div>
              {day.slots.length === 0 ? <p className="hint">No slots.</p> : (
                <div className="slot-chips">
                  {day.slots.map((s, j) => (
                    <span className="slot-chip" key={j}>
                      {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                      <span className="count">×{s.availableCount}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
