const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export function createWebhook(data: any) {
  return call('/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function listWebhooks() {
  return call('/webhooks');
}

export function getWebhookById(id: string) {
  return call(`/webhooks/${encodeURIComponent(id)}`);
}

export function updateWebhook(id: string, data: any) {
  return call(`/webhooks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteWebhook(id: string) {
  return call(`/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
