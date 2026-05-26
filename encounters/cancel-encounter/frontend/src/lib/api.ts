const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007';

export async function getEncounterStatus(encounterId: number) {
  const res = await fetch(`${API_URL}/encounters/${encounterId}/status`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as { status: string; encounterId: number };
}

export async function cancelEncounter(encounterId: number) {
  const res = await fetch(`${API_URL}/encounters/${encounterId}/cancel`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
