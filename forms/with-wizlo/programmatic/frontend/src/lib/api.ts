/**
 * api.ts — thin fetch wrappers for every backend endpoint.
 *
 * All calls go to the local NestJS backend (NEXT_PUBLIC_API_URL), which in turn
 * authenticates with Wizlo and proxies the request. The frontend never talks
 * to the Wizlo API directly.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';

// ─────────────────────────────────────────────────────────────
// Patients
// ─────────────────────────────────────────────────────────────

/** Search patients by email or return the first 20 if no email given. */
export async function getPatients(email?: string) {
  const url = email
    ? `${API_URL}/patients?email=${encodeURIComponent(email)}`
    : `${API_URL}/patients`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return Array.isArray(json) ? json : (json?.data ?? []);
}

/** Create a new patient in Wizlo. Returns the created patient with its `id`. */
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

/** Update an existing patient's fields. */
export async function updatePatient(
  id: string,
  data: { firstName?: string; lastName?: string; email?: string },
) {
  const res = await fetch(`${API_URL}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

// ─────────────────────────────────────────────────────────────
// Forms
// ─────────────────────────────────────────────────────────────

/** Fetch all published forms so the user can pick one. */
export async function getForms() {
  const res = await fetch(`${API_URL}/forms`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  // Wizlo may return { data: [...] } or a plain array
  return Array.isArray(json) ? json : (json?.data ?? [json]);
}

/**
 * Fetch the field schema for a specific form.
 *
 * Returns:
 *  - fieldSchema[]   — flat list of fields with label, dataType, required, isPHI, etc.
 *  - structure       — the form template (pages → rows → fields) with empty values
 *  - payloadTemplate — same as structure, ready to be cloned and filled for submission
 */
export async function getFormSchema(formId: string) {
  const res = await fetch(`${API_URL}/forms/${formId}/schema`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  // Wizlo wraps the schema in { data: { ... } } — unwrap it like other endpoints
  return json?.data ?? json;
}

// ─────────────────────────────────────────────────────────────
// Submission
// ─────────────────────────────────────────────────────────────

/**
 * Submit the filled form to Wizlo.
 *
 * The `structure` must follow the pages → rows → fields tree that Wizlo expects.
 * The easiest way to build it:
 *  1. Call getFormSchema(formId) and grab `payloadTemplate`
 *  2. Deep-clone the template
 *  3. Walk every field and set field.value = <user-entered value>
 *  4. Pass the filled structure here
 *
 * Returns { success, submissionId, patientUpdated, vitalsRecorded, ... }
 */
export async function submitForm(data: {
  formId: string;
  patientId: string;
  structure: unknown;
  metadata?: {
    source?: string;
    externalReferenceId?: string;
    submittedBySystem?: string;
  };
}) {
  const res = await fetch(`${API_URL}/submission/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
