'use client';
import { useEffect, useState } from 'react';
import {
  getCountries, getStates,
  type Country, type State,
} from '@/lib/api';

export default function LocationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  // Address selection: country (display) → state (select) → city (free text).
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [city, setCity] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([getCountries(), getStates()]);
        setCountries(c);
        setStates(s);
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickState = (state: State) => {
    setSelectedState(state);
    setCity('');
  };

  return (
    <div className="container">
      <h1>Locations</h1>
      <p className="subtitle">
        Reference data for address forms — countries and states from the Wizlo API, plus a
        free-text city. Both list endpoints use the tenant (M2M) admin token.
      </p>

      {loadError && <div className="error-box" style={{ marginBottom: 24 }}>{loadError}</div>}

      <div className="grid-2">
        <div className="card">
          <span className="badge">GET /countries</span>
          <h2>Countries <span className="count-pill">{countries.length}</span></h2>
          <p className="hint" style={{ marginBottom: 12 }}>Static reference list.</p>
          <div className="list">
            {loading ? <div className="empty-state">Loading…</div> :
              countries.length === 0 ? <div className="empty-state">No countries.</div> :
              countries.map(c => (
                <div className="list-item" key={c.id} style={{ cursor: 'default' }}>
                  <span>{c.name}</span>
                  <span className="code">{c.shortName}{c.phoneCode != null ? ` · +${c.phoneCode}` : ''}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <span className="badge">GET /states</span>
          <h2>States <span className="count-pill">{states.length}</span></h2>
          <p className="hint" style={{ marginBottom: 12 }}>Click a state to build an address below.</p>
          <div className="list">
            {loading ? <div className="empty-state">Loading…</div> :
              states.length === 0 ? <div className="empty-state">No states.</div> :
              states.map(s => (
                <div
                  className={`list-item${selectedState?.id === s.id ? ' selected' : ''}`}
                  key={s.id}
                  onClick={() => pickState(s)}
                >
                  <span>{s.name}</span>
                  <span className="code">{s.shortName}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card">
        <span className="badge">City — free text</span>
        <h2>City</h2>
        <div className="info-box">
          The Wizlo <strong>City entity is deprecated</strong> — city is now a free-text field.
          The legacy lookup endpoints (<code>GET /cities/…</code>, <code>GET /states/:id/cities</code>)
          are backwards-compat only and the latter returns <code>410 Gone</code>. New integrations
          should capture city as plain text, like the input below.
        </div>
        {!selectedState ? (
          <p className="empty-state">Select a state above to complete the address.</p>
        ) : (
          <>
            <div className="form-group" style={{ marginTop: 4 }}>
              <label>City in {selectedState.name} ({selectedState.shortName})</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Phoenix"
              />
            </div>
            <div className="summary-strip">
              <span className="code">
                {[city.trim() || '—', selectedState.shortName, selectedState.country?.shortName ?? '']
                  .filter(Boolean).join(', ')}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
