const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type EncounterScenario =
  | 'standard-sync'
  | 'standard-async'
  | 'hrt'
  | 'provider-network'
  | 'with-forms'
  | 'skip-order';

export async function createEncounter(data: {
  patientId: string;
  scenario: EncounterScenario;
  formIds?: string[];
  treatmentIds?: string[];
  additionalNotes?: string;
  scheduledDay?: string;
  scheduledTime?: string;
  providerNetworkTenantId?: string;
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
