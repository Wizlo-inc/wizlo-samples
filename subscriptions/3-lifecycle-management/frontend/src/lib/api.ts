const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3022';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export function getStats() {
  return call('/subscriptions/stats');
}

export function listSubscriptions(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return call(`/subscriptions${qs}`);
}

export function getTimeline(id: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}/timeline`);
}

export function pauseSubscription(id: string, pausedUntilDate?: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}/pause`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pausedUntilDate ? { pausedUntilDate } : {}),
  });
}

export function resumeSubscription(id: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}/resume`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export function cancelSubscription(id: string, reason: string, description?: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, ...(description ? { description } : {}) }),
  });
}

export function delaySubscription(id: string, newFulfillmentDate: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}/delay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newFulfillmentDate }),
  });
}

export function resubscribeSubscription(id: string) {
  return call(`/subscriptions/${encodeURIComponent(id)}/resubscribe`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}
