const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3024';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export function getStats() {
  return call('/portal/stats');
}

export function listSubscriptions(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return call(`/portal${qs}`);
}

export function getSubscription(id: string) {
  return call(`/portal/${encodeURIComponent(id)}`);
}

export function getPscLocations(zipCode: string, radius?: number) {
  const params = new URLSearchParams({ zipCode });
  if (radius) params.set('radius', String(radius));
  return call(`/portal/psc-locations?${params.toString()}`);
}

export function pauseSubscription(id: string, pausedUntilDate?: string) {
  return call(`/portal/${encodeURIComponent(id)}/pause`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pausedUntilDate ? { pausedUntilDate } : {}),
  });
}

export function resumeSubscription(id: string) {
  return call(`/portal/${encodeURIComponent(id)}/resume`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export function cancelSubscription(id: string, reason: string, description?: string) {
  return call(`/portal/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, ...(description ? { description } : {}) }),
  });
}

export function delaySubscription(id: string, newFulfillmentDate: string) {
  return call(`/portal/${encodeURIComponent(id)}/delay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newFulfillmentDate }),
  });
}

export function scheduleLab(id: string, bookingKey: string, asyncConfirmation = true) {
  return call(`/portal/${encodeURIComponent(id)}/schedule-lab`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingKey, asyncConfirmation }),
  });
}
