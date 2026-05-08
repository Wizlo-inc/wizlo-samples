const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export async function createOrder(data: { patientId: string; productOfferId: string; qty: number }) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

export async function getSubscriptionOrders(subscriptionId: string) {
  const res = await fetch(`${API_URL}/orders/subscription/${encodeURIComponent(subscriptionId)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
