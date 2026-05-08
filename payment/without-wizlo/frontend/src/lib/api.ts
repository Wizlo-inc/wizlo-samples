const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

export async function createSubscription(data: { patientId: string; planType: string; email?: string }) {
  const res = await fetch(`${API_URL}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

export async function getAllSubscriptions() {
  const res = await fetch(`${API_URL}/subscriptions`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
