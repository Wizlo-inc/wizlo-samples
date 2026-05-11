const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export async function createEncounter(data: {
  patientId: string;
  providerNetworkTenantId: string;
  formIds: string[];
  treatmentIds?: string[];
  additionalNotes?: string;
}) {
  const res = await fetch(`${API_URL}/encounters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
