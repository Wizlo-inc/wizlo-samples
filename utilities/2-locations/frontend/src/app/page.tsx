'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  getCountries, getStates, getCitiesByState,
  type Country, type State, type City,
} from '@/lib/api';

export default function LocationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  // Cities-by-state
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cityError, setCityError] = useState('');

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

  const loadCities = useCallback(async (state: State, search: string) => {
    setCitiesLoading(true);
    setCityError('');
    try {
      setCities(await getCitiesByState(state.id, search.trim() || undefined));
    } catch (err: unknown) {
      setCityError(err instanceof Error ? err.message : 'Failed to load cities');
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  const pickState = (state: State) => {
    setSelectedState(state);
    setCitySearch('');
  };

  // Load cities for the selected state: immediately on (re)select or when the
  // search is cleared, debounced while the user is typing a search term.
  useEffect(() => {
    if (!selectedState) return;
    const term = citySearch.trim();
    if (!term) {
      loadCities(selectedState, '');
      return;
    }
    const t = setTimeout(() => loadCities(selectedState, term), 350);
    return () => clearTimeout(t);
  }, [citySearch, selectedState, loadCities]);

  return (
    <div className="container">
      <h1>Locations</h1>
      <p className="subtitle">
        Reference data for address forms and dropdowns — countries, states, and cities-by-state.
        All three use the tenant (M2M) admin token.
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
          <p className="hint" style={{ marginBottom: 12 }}>Click a state to load its cities below.</p>
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
        <span className="badge">GET /cities/state/:stateId/search</span>
        <h2>Cities by state</h2>
        {!selectedState ? (
          <p className="empty-state">Select a state above to load its cities.</p>
        ) : (
          <>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <div>
                <label>Search cities in {selectedState.name} ({selectedState.shortName})</label>
                <input
                  type="text"
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  placeholder="Type to filter, e.g. 'New'"
                />
                <span className="hint">Results are capped at 20 by the API for performance.</span>
              </div>
            </div>
            {cityError && <div className="error-box">{cityError}</div>}
            <div className="list">
              {citiesLoading ? <div className="empty-state">Loading…</div> :
                cities.length === 0 ? <div className="empty-state">No cities found.</div> :
                cities.map(c => (
                  <div className="list-item" key={c.id} style={{ cursor: 'default' }}>
                    <span>{c.name}</span>
                    <span className="code">{c.id.slice(0, 8)}…</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
