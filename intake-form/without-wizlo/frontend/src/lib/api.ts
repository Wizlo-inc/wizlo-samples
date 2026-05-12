const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export async function getClients(email?: string) {
  const url = email
    ? `${API_URL}/patients?email=${encodeURIComponent(email)}`
    : `${API_URL}/patients`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return Array.isArray(json) ? json : (json?.data ?? []);
}

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

export async function updatePatient(id: string, data: { firstName?: string; lastName?: string; email?: string }) {
  const res = await fetch(`${API_URL}/patients/${id}`, {
    method: 'PUT',
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

export async function getFormDetail(formId: string) {
  const res = await fetch(`${API_URL}/forms/${formId}`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
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

export async function getAllIntakes() {
  const res = await fetch(`${API_URL}/intake`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
