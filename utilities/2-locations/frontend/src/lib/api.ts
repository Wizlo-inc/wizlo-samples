const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3081';

async function call<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : JSON.stringify(json));
  return json as T;
}

export interface Country { id: string; name: string; shortName: string; phoneCode?: number }
export interface State { id: string; name: string; shortName: string; countryId: string; country?: { id: string; name: string; shortName: string } }
export interface City { id: string; name: string; stateId: string }

export function getCountries() {
  return call<Country[]>('/locations/countries');
}

export function getStates() {
  return call<State[]>('/locations/states');
}

export function getCitiesByState(stateId: string, search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return call<City[]>(`/locations/cities/${encodeURIComponent(stateId)}${qs}`);
}
