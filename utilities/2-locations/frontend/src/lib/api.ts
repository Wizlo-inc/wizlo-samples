const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3081';

async function call<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : JSON.stringify(json));
  return json as T;
}

export interface Country { id: string; name: string; shortName: string; phoneCode?: number }
export interface State { id: string; name: string; shortName: string; countryId: string; country?: { id: string; name: string; shortName: string } }

export function getCountries() {
  return call<Country[]>('/locations/countries');
}

export function getStates() {
  return call<State[]>('/locations/states');
}

// NOTE: No getCitiesByState — the Wizlo City entity is deprecated and city is
// now a free-text field. Capture city as plain text instead of looking up IDs.
