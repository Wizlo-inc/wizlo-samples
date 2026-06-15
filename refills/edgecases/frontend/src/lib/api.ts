/**
 * Module:    Refills / Edge Cases
 * Workflow:  Frontend → backend API client
 * File:      lib/api.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-19
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json === 'string' ? json : JSON.stringify(json));
  return json as T;
}

export const getEligibleEncounters = (patientId: string) =>
  request<{ success: boolean; data: EligibleEncounter[] }>(
    `/eligibility/encounters?patientId=${encodeURIComponent(patientId)}`,
  );

export const getEncounterTreatments = (encounterId: string) =>
  request<{ success: boolean; data: { encounter: { id: number }; treatments: Treatment[] } }>(
    `/eligibility/encounter/${encodeURIComponent(encounterId)}/treatments`,
  );

export const createRefill = (body: {
  patientId: string;
  encounterTreatmentIds: string[];
  bypassDaysOfSupply?: boolean;
}) =>
  request<unknown>(`/refill-orders`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export interface EligibleEncounter {
  id: number;
  gfeId?: string;
  status?: string;
  completedAt?: string;
  patient?: { firstName: string; lastName: string };
  refillableTreatmentsCount?: number;
}

export interface Treatment {
  encounterTreatmentId: string;
  treatment?: { id: string; name: string; unitPrice?: number; drugStrength?: string };
  quantity?: number;
  refillInfo?: {
    remainingRefills: number;
    canRefillNow: boolean;
    daysUntilNextRefill?: number;
    // `reason` is the eligibility status (e.g. no_refills_remaining,
    // next_refill_in_x_days), present only when canRefillNow is false.
    reason?: string;
  };
}
