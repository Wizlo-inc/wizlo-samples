/**
 * Module:    Refills
 * Workflow:  Frontend → backend API client
 * File:      lib/api.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 *
 * Thin fetch wrapper that talks to the refills NestJS backend. The backend
 * proxies every call to Wizlo with an OAuth bearer token.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json === 'string' ? json : JSON.stringify(json));
  return json as T;
}

// Step 1 — eligibility
export const getEligibleEncounters = (patientId: string) =>
  request<{ success: boolean; data: EligibleEncounter[] }>(
    `/eligibility/encounters?patientId=${encodeURIComponent(patientId)}`,
  );

export const getEncounterTreatments = (encounterId: string) =>
  request<{ success: boolean; data: { encounter: EncounterSummary; treatments: Treatment[] } }>(
    `/eligibility/encounter/${encodeURIComponent(encounterId)}/treatments`,
  );

// Step 2 — create refill
export const createRefill = (body: {
  patientId: string;
  encounterTreatmentIds: string[];
  bypassDaysOfSupply?: boolean;
}) =>
  request<{ success: boolean; message: string; data: RefillOrder }>(`/refill-orders`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getOrder = (orderId: string) =>
  request<{ success: boolean; data: RefillOrder }>(`/refill-orders/${encodeURIComponent(orderId)}`);

// Step 3 — rx submission
export const markOrderPaid = (orderId: string) =>
  request<MarkPaidResponse>(`/rx-submission/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({ orderIds: [orderId] }),
  });

export const submitRefillRx = (orderId: string) =>
  request<SubmitRxResponse>(`/rx-submission/submit/${encodeURIComponent(orderId)}`, {
    method: 'POST',
  });

// ───── Types ─────
export interface EligibleEncounter {
  id: number;
  gfeId?: string;
  status?: string;
  completedAt?: string;
  clinic?: { id: string; name: string };
  patient?: { id: string; firstName: string; lastName: string };
  indicatedTreatmentsCount?: number;
  refillableTreatmentsCount?: number;
}

export interface EncounterSummary {
  id: number;
  gfeId?: string;
  status?: string;
}

export interface Treatment {
  encounterTreatmentId: string;
  treatment?: { id: string; name: string; unitPrice?: number; drugStrength?: string };
  pharmacyName?: string;
  encounterTreatmentStatus?: string;
  rxStatus?: string;
  quantity?: number;
  refillInfo?: {
    remainingRefills: number;
    canRefillNow: boolean;
    daysUntilNextRefill?: number;
    // `reason` is the eligibility status (e.g. no_refills_remaining,
    // next_refill_in_x_days), present only when canRefillNow is false.
    reason?: string;
  };
  pricing?: {
    unitPrice: number;
    quantity: number;
    subtotal: number;
    shipping: number;
    platformFee: number;
    total: number;
  };
}

export interface RefillOrder {
  orderId?: string;
  id?: string;
  orderNo?: string;
  orderType?: string;
  status?: string;
  paymentStatus?: string;
  treatments?: Array<{ name?: string; quantity?: number; drugStrength?: string }>;
  totals?: { subtotal: number; shipping: number; platformFee: number; total: number };
  refillInfo?: Array<{
    encounterTreatmentId: string;
    treatmentName: string;
    remainingRefills: number;
    nextRefillDate: string;
  }>;
}

export interface MarkPaidResponse {
  message: string;
  data: {
    summary: {
      totalOrders: number;
      markedPaidOrders: number;
      paidOrders: number;
      unpaidOrders: number;
    };
    paymentDetails?: { paymentMethod?: string; paymentType?: string };
  };
}

export interface SubmitRxResponse {
  message: string;
  data: {
    orderId: string;
    totalItems: number;
    successCount: number;
    failureCount: number;
    encounterStatus: string | null;
    items: Array<{
      orderItemId: string;
      productName?: string;
      success: boolean;
      skipped?: boolean;
      error?: string;
      data?: {
        apiOrderId?: string;
        pharmacyName?: string;
        pharmacyProvider?: string;
        submissionType?: string;
        submittedAt?: string;
        rxStatus?: string;
        encounterId?: string;
        encounterStatus?: string;
        message?: string;
      };
    }>;
  };
}
