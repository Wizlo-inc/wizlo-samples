const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export async function createPatient(data: { firstName: string; lastName: string; email: string }) {
  const res = await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

export async function getForms() {
  const res = await fetch(`${API_URL}/forms`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return Array.isArray(json) ? json : (json?.data ?? [json]);
}

export async function submitIntake(data: { formId: string; patientId: string; structure: unknown }) {
  const res = await fetch(`${API_URL}/intake/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
