/**
 * api.ts — fetch wrappers for the iframe-forms backend endpoints.
 *
 * All calls go to the local NestJS backend (NEXT_PUBLIC_API_URL).
 * The backend handles Wizlo authentication and proxies the requests.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3022';

// ─── Patients ────────────────────────────────────────────────────────────────

export async function getPatients(email?: string) {
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

// ─── Forms ───────────────────────────────────────────────────────────────────

/**
 * Check whether a form has the PHI fields required for iframe embedding.
 * Returns { compatible: boolean, missingFields: string[] }.
 * This is a read-only check — no invitations are created.
 */
export async function checkFormCompatible(formId: string): Promise<{
  compatible: boolean;
  status: 'ready' | 'needs_setup' | 'missing_phi' | 'error';
  message: string;
}> {
  try {
    const res = await fetch(`${API_URL}/forms/${formId}/compatible`);
    const json = await res.json();
    return json;
  } catch {
    return { compatible: false, status: 'error', message: 'Check failed' };
  }
}

/** Fetch all published forms so the user can pick one. */
export async function getForms() {
  const res = await fetch(`${API_URL}/forms`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return Array.isArray(json) ? json : (json?.data ?? [json]);
}

/**
 * Create a Wizlo form invitation for a specific form.
 *
 * Calls POST /forms/attach on the backend which proxies to the Wizlo API.
 *
 * Returns:
 *  - formId               — the form UUID
 *  - userFormInvitationId — Wizlo's internal tracking ID for this invitation
 *  - embedUrl             — the URL to put in your <iframe src="...">
 *
 * The embedUrl contains a hashed token. It is safe to use directly in the
 * browser — no credentials are exposed.
 */
export async function attachForm(formId: string, patientId: string): Promise<{
  formId: string;
  embedUrl: string;
}> {
  const res = await fetch(`${API_URL}/forms/attach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formId, patientId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
