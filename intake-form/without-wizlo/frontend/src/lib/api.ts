const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export async function submitIntake(data: Record<string, unknown>) {
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
