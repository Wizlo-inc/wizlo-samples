const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export interface CreatePlanData {
  name: string;
  productIds: string[];
  planPrice: number;
  firstPurchaseDiscount?: number;
  fulfillmentCycle: string;
  fulfillmentInterval: number;
  fulfillmentDateChangeCutoffHours?: number;
  pauseCutoffDays?: number;
  status?: string;
  planCreatedFor?: string;
  maxRenewal?: number;
  reassessmentFormId: string;
  imageUrl?: string;
}

export function createPlan(data: CreatePlanData) {
  return call('/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function listPlans(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return call(`/plans${qs}`);
}

export function getStatusCounts() {
  return call('/plans/status-counts');
}

export function getPlanById(id: string) {
  return call(`/plans/${encodeURIComponent(id)}`);
}

export function updatePlan(id: string, data: Partial<CreatePlanData>) {
  return call(`/plans/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updatePlanStatus(id: string, status: string) {
  return call(`/plans/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
