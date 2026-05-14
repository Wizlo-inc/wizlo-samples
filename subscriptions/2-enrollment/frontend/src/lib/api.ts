const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3021';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export function createSubscription(data: {
  patientId: string;
  subscriptionPlanId: string;
  effectiveDate?: string;
  duration?: number;
  clinicId?: string;
  deferEncounterCreation?: boolean;
}) {
  return call('/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function checkout(data: { clientSubscriptionId: string; couponCode?: string }) {
  return call('/subscriptions/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getEmbedToken(data: { amount?: number; currency?: string; buyerExternalIdentifier?: string }) {
  return call('/payments/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function markPaid(data: { clientSubscriptionId: string; transactionId: string }) {
  return call('/subscriptions/mark-paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getSubscription(id: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}`);
}

export function getOrders(id: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return call(`/subscriptions/${encodeURIComponent(id)}/orders${qs}`);
}

export function getTransactions(id: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return call(`/subscriptions/${encodeURIComponent(id)}/transactions${qs}`);
}
