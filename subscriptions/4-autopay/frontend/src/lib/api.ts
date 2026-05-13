const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3023';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export function getAutopay(subscriptionId: string) {
  return call(`/subscriptions/${encodeURIComponent(subscriptionId)}/autopay`);
}

export function updateAutopay(subscriptionId: string, data: { autopayEnabled?: boolean; autopayPaymentMethodId?: string }) {
  return call(`/subscriptions/${encodeURIComponent(subscriptionId)}/autopay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updatePaymentMethod(subscriptionId: string, paymentMethodId: string) {
  return call(`/subscriptions/${encodeURIComponent(subscriptionId)}/autopay/payment-method`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethodId }),
  });
}

export function retryPayment(subscriptionId: string) {
  return call(`/subscriptions/${encodeURIComponent(subscriptionId)}/retry-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export function resendPaymentLink(subscriptionId: string) {
  return call(`/subscriptions/${encodeURIComponent(subscriptionId)}/resend-payment-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}
