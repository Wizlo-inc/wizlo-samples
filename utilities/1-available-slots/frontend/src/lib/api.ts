const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080';

async function call<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : JSON.stringify(json));
  return json as T;
}

// ── type=provider ──────────────────────────────────────────────────────
export interface ProviderSlot { start: string; end: string; timezone: string }
export interface ProviderSlotsResponse {
  encounterId: number;
  timezone: string;
  slots: Record<string, ProviderSlot[]>;
}

export function getProviderSlots(params: { patientEmail: string; encounterId: string; date?: string }) {
  const qs = new URLSearchParams({ type: 'provider', patientEmail: params.patientEmail, encounterId: params.encounterId });
  if (params.date) qs.set('date', params.date);
  return call<ProviderSlotsResponse>(`/available-slots?${qs.toString()}`);
}

// ── type=lab ───────────────────────────────────────────────────────────
export interface LabSlot {
  bookingKey: string | null;
  startTime: string;
  endTime: string;
  price: number;
  isPriority: boolean;
  availableCount: number;
  expiresAt?: string | null;
}
export interface LabLocation {
  code: string;
  name: string;
  address?: { firstLine?: string; secondLine?: string | null; city?: string; state?: string; zipCode?: string };
  distance?: number | null;
  timezone?: string | null;
}
export interface LabDaySlots { date: string; location: LabLocation; slots: LabSlot[] }
export interface LabSlotsResponse { availability: LabDaySlots[]; timezone?: string | null }

export function getLabSlots(params: {
  patientEmail: string; zipCode: string; lab?: string; radius?: string; startDate?: string;
}) {
  const qs = new URLSearchParams({ type: 'lab', patientEmail: params.patientEmail, zipCode: params.zipCode });
  if (params.lab) qs.set('lab', params.lab);
  if (params.radius) qs.set('radius', params.radius);
  if (params.startDate) qs.set('startDate', params.startDate);
  return call<LabSlotsResponse>(`/available-slots?${qs.toString()}`);
}
