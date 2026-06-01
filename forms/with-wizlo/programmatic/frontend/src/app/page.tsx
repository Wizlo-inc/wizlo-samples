'use client';

/**
 * Programmatic Forms — main page
 *
 * This page demonstrates the "programmatic forms" pattern:
 *   YOUR app renders the form UI → user fills it → you submit the data to Wizlo.
 *
 * Three steps:
 *  Step 1 — Patient   : search for an existing patient by email or create a new one.
 *  Step 2 — Form      : list all published Wizlo forms and pick one.
 *  Step 3 — Fill      : the form's field schema is loaded and each field is
 *                       rendered as a standard HTML input. The user fills it in.
 *  Submit             : the filled structure is sent to POST /forms/programmatic/submit.
 *  Success            : Wizlo returns submissionId, patientUpdated, vitalsRecorded.
 */

import { useState, useCallback } from 'react';
import {
  getPatients,
  createPatient,
  getForms,
  getFormSchema,
  submitForm,
} from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type Patient = Record<string, unknown> & { id: string; firstName?: string; lastName?: string; email?: string };
type Form = Record<string, unknown> & { id: string; name: string; title?: string; description?: string };

interface FieldSchema {
  fieldName: string;   // machine name — used as the key when building the structure
  label: string;       // human-readable label shown in the UI
  type: string;        // input | textarea | select | checkbox | ...
  dataType: string;    // text | number | date | email | tel | ...
  required: boolean;
  isPHI: boolean;      // if true, this value is mapped back to the patient's record
  pageContext: number; // which page of the form this field belongs to (1-based)
}

interface SchemaResult {
  fieldSchema: FieldSchema[];
  /**
   * The submission template — either `payloadTemplate` or `structure` from the
   * Wizlo schema response. We normalise whichever key is present when we load
   * the schema so the rest of the code always uses this field.
   */
  payloadTemplate: unknown;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = ['Patient', 'Form', 'Fill & Submit'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'active' : '';
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < STEPS.length ? 1 : 0 }}>
            <div className="step">
              <div className={`step-circle ${state}`}>{n < current ? '✓' : n}</div>
              <span className={`step-label ${state === 'active' ? 'active' : ''}`}>{label}</span>
            </div>
            {n < STEPS.length && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a field's dataType to an HTML input type attribute.
 * Falls back to 'text' for anything unrecognised.
 */
function inputType(field: FieldSchema): string {
  const map: Record<string, string> = {
    number: 'number',
    date: 'date',
    email: 'email',
    tel: 'tel',
    time: 'time',
  };
  return map[field.dataType] ?? 'text';
}

/**
 * Walk the payloadTemplate tree and fill in user-entered values.
 *
 * The template already contains the correct page → row → field structure
 * that Wizlo expects. We deep-clone it and set `field.value` wherever the
 * user has entered something.
 *
 * This is the key step that converts your custom UI's data into the exact
 * JSON shape POST /forms/programmatic/submit requires.
 */
function buildStructure(
  template: unknown,
  values: Record<string, string>,
): unknown {
  if (template == null) throw new Error('Form payload template is missing — schema may not have loaded correctly');
  const structure = JSON.parse(JSON.stringify(template)) as {
    pages?: Array<{
      rows?: Array<{
        fields?: Array<{ name?: string; value?: unknown }>;
      }>;
    }>;
  };

  for (const page of structure.pages ?? []) {
    for (const row of page.rows ?? []) {
      for (const field of row.fields ?? []) {
        if (field.name && values[field.name] !== undefined) {
          field.value = values[field.name];
        }
      }
    }
  }
  return structure;
}

// ─── Schema normalisation ────────────────────────────────────────────────────

/**
 * Infer an HTML input `type` from a Wizlo field variant name or field machine name.
 * Falls back to 'text' for anything unrecognised.
 */
function inferDataType(variant: string, fieldName: string): string {
  if (variant === 'email' || fieldName.includes('email')) return 'email';
  if (variant === 'date' || fieldName.includes('dob') || fieldName.includes('date')) return 'date';
  if (variant === 'number') return 'number';
  if (fieldName.includes('weight') || fieldName.includes('height') || fieldName.includes('bmi')) return 'number';
  if (variant === 'tel' || fieldName.includes('phone')) return 'tel';
  return 'text';
}

/**
 * Build a flat `FieldSchema[]` from the nested `structure.pages[].rows[].fields[]`
 * tree that Wizlo returns from `GET /forms/:id/schema`.
 *
 * This is needed because some API versions don't return a separate `fieldSchema`
 * array — the field metadata is embedded inside the structure itself.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFieldsFromStructure(structure: any): FieldSchema[] {
  const fields: FieldSchema[] = [];
  (structure?.pages ?? []).forEach((page: any, pageIdx: number) => {
    (page?.rows ?? []).forEach((row: any) => {
      (row?.fields ?? []).forEach((field: any) => {
        // Skip composite/complex fields (BMI calculator, file upload, signature)
        // that can't be submitted as a plain text value
        const unsupported = ['bmi_calculator', 'fileupload', 'signature', 'product'];
        if (!field.name || unsupported.includes(field.variant)) return;

        fields.push({
          fieldName: field.name,
          label: field.label ?? field.name,
          type: field.variant ?? 'input',
          dataType: inferDataType(field.variant ?? '', field.name ?? ''),
          required: field.required ?? false,
          isPHI: field.category === 'patient_info',
          pageContext: pageIdx + 1,
        });
      });
    });
  });
  return fields;
}

/**
 * Normalise the raw schema response from `GET /forms/:id/schema`.
 *
 * The Wizlo API may return the data in several shapes:
 *   A. { fieldSchema: [...], payloadTemplate: {...} }   ← newer API
 *   B. { fieldSchema: [...], structure: {...} }         ← structure as template
 *   C. { structure: { pages: [...] } }                  ← only structure, no fieldSchema
 *
 * We always produce { fieldSchema, payloadTemplate } so the rest of the UI
 * doesn't need to handle the differences.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseSchema(raw: any): SchemaResult {
  // Prefer explicit payloadTemplate, fall back to structure
  const payloadTemplate = raw.payloadTemplate ?? raw.structure ?? null;

  // Prefer explicit fieldSchema array, fall back to extracting from structure
  const fieldSchema: FieldSchema[] =
    Array.isArray(raw.fieldSchema) && raw.fieldSchema.length > 0
      ? raw.fieldSchema.map((f: any) => ({
          fieldName: f.fieldName ?? f.key ?? f.name ?? '',
          label: f.label ?? f.fieldName ?? '',
          type: f.type ?? f.variant ?? 'input',
          dataType: f.dataType ?? inferDataType(f.type ?? f.variant ?? '', f.fieldName ?? f.name ?? ''),
          required: f.required ?? false,
          isPHI: f.isPHI ?? f.category === 'patient_info',
          pageContext: f.pageContext ?? 1,
        }))
      : extractFieldsFromStructure(payloadTemplate);

  return { fieldSchema, payloadTemplate };
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ProgrammaticFormsPage() {
  const [step, setStep] = useState(1);

  // ── Step 1 state ──
  const [emailSearch, setEmailSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', email: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ── Step 2 state ──
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  // ── Step 3 state ──
  const [schema, setSchema] = useState<SchemaResult | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // ── Submission state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResultShape | null>(null);
  const [submitError, setSubmitError] = useState('');

  // ── Generic loading / error ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Search Wizlo for patients matching the entered email address. */
  const handleSearch = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const results = await getPatients(emailSearch.trim() || undefined);
      setPatients(results);
      if (results.length === 0) setShowCreateForm(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [emailSearch]);

  /**
   * Create a brand-new patient in Wizlo and immediately select them.
   * Wizlo requires firstName, lastName, and email at minimum.
   */
  const handleCreatePatient = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const patient = await createPatient(newPatient);
      setSelectedPatient(patient as Patient);
      setStep(2);
      loadForms();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }, [newPatient]);

  /** Select an existing patient from the search results and proceed. */
  const handleSelectPatient = useCallback(async (p: Patient) => {
    setSelectedPatient(p);
    setStep(2);
    loadForms();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Load all published forms from Wizlo so the user can pick one. */
  const loadForms = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getForms();
      setForms(data as Form[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select a form and load its field schema.
   *
   * The schema drives Step 3: we use `fieldSchema` to render one input per
   * field, and store `payloadTemplate` so we can build the submission structure.
   */
  const handleSelectForm = useCallback(async (form: Form) => {
    setSelectedForm(form);
    setError('');
    setLoading(true);
    try {
      const rawSchema = await getFormSchema(form.id);

      // Normalise the API response — handles both:
      //   { fieldSchema, payloadTemplate }  (newer API shape)
      //   { structure: { pages: [...] } }   (UAT / older API — fields embedded in structure)
      const normalised = normaliseSchema(rawSchema);

      if (!normalised.payloadTemplate) {
        throw new Error('Schema loaded but form structure is empty — the form may have no fields.');
      }

      setSchema(normalised);
      setFieldValues({}); // reset any previously entered values
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load form schema');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3 — submit
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build the submission structure and send it to Wizlo.
   *
   * Key steps:
   *  1. Clone the payloadTemplate (exact JSON shape Wizlo expects)
   *  2. Walk every field in the tree and fill `field.value` from fieldValues
   *  3. POST to /forms/programmatic/submit with formId + patientId + structure
   *
   * Wizlo processes the submission and:
   *  - Creates a formal submission record (returns submissionId)
   *  - Maps PHI fields (firstName, DOB, address…) back to the patient record
   *  - Records health vitals (BP, weight, height…) if the form has those fields
   */
  const handleSubmit = useCallback(async () => {
    if (!selectedPatient || !selectedForm || !schema) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitResult(null);

    try {
      // `schema.payloadTemplate` is guaranteed to be set by normaliseSchema
      // (it holds either the original payloadTemplate or the structure).
      // buildStructure deep-clones it and fills every field.value from fieldValues.
      const structure = buildStructure(schema.payloadTemplate, fieldValues);

      const result = await submitForm({
        formId: selectedForm.id,
        patientId: selectedPatient.id,
        structure,
        metadata: {
          source: 'programmatic-sample',
          submittedBySystem: 'Wizlo Samples / Programmatic Forms',
        },
      });

      setSubmitResult(result);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [selectedPatient, selectedForm, schema, fieldValues]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container">
      <h1>Programmatic Forms</h1>
      <p className="subtitle">
        Your app collects the answers in your own UI — Wizlo processes and stores the submission.
      </p>

      <StepBar current={step} />

      {/* ─── STEP 1 — Patient ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <h2>Step 1 — Find or Create Patient</h2>
          <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: 20 }}>
            Every form submission in Wizlo is tied to a patient record.
            Search by email to find an existing one, or create a new one below.
          </p>

          {/* Search row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              type="email"
              placeholder="Search by email address…"
              value={emailSearch}
              onChange={e => setEmailSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Search'}
            </button>
          </div>

          {/* Search results table */}
          {patients.length > 0 && (
            <table style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={String(p.id)}>
                    <td>{String(p.firstName ?? '')} {String(p.lastName ?? '')}</td>
                    <td>{String(p.email ?? '')}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSelectPatient(p)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Divider + create patient form */}
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

          <div style={{ marginBottom: 12 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCreateForm(v => !v)}
            >
              {showCreateForm ? 'Hide' : '+ Create new patient'}
            </button>
          </div>

          {showCreateForm && (
            <>
              <div className="row-2">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={newPatient.firstName}
                    onChange={e => setNewPatient(p => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={newPatient.lastName}
                    onChange={e => setNewPatient(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCreatePatient}
                disabled={loading || !newPatient.firstName || !newPatient.lastName || !newPatient.email}
              >
                {loading ? <span className="spinner" /> : 'Create Patient'}
              </button>
            </>
          )}

          {error && <div className="error-box">{error}</div>}
        </div>
      )}

      {/* ─── STEP 2 — Select Form ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="card">
          {/* Show which patient was selected */}
          {selectedPatient && (
            <div className="patient-chip" style={{ marginBottom: 20 }}>
              <span>
                Patient: <strong>{String(selectedPatient.firstName ?? '')} {String(selectedPatient.lastName ?? '')}</strong>
                {' '}— {String(selectedPatient.email ?? '')}
              </span>
              <button onClick={() => { setStep(1); setSelectedForm(null); setSchema(null); }}>×</button>
            </div>
          )}

          <h2>Step 2 — Pick a Form</h2>
          <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: 20 }}>
            These are all your published Wizlo forms. Click one to load its field schema
            and proceed to fill it in.
          </p>

          {loading && <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>}

          {!loading && forms.length === 0 && (
            <div className="empty-state">No published forms found. Publish a form in Wizlo first.</div>
          )}

          {forms.map(f => (
            <div
              key={f.id}
              className={`form-card ${selectedForm?.id === f.id ? 'selected' : ''}`}
              onClick={() => handleSelectForm(f)}
            >
              <div className="form-name">{String(f.name ?? f.title ?? 'Untitled Form')}</div>
              <div className="form-meta">
                ID: {f.id}
                {f.description ? ` · ${String(f.description)}` : ''}
              </div>
            </div>
          ))}

          {error && <div className="error-box">{error}</div>}

          <div className="nav-buttons">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
          </div>
        </div>
      )}

      {/* ─── STEP 3 — Fill form fields ─────────────────────────────────── */}
      {step === 3 && !submitResult && (
        <div className="card">
          {selectedPatient && (
            <div className="patient-chip" style={{ marginBottom: 20 }}>
              <span>
                Patient: <strong>{String(selectedPatient.firstName ?? '')} {String(selectedPatient.lastName ?? '')}</strong>
              </span>
            </div>
          )}

          <h2>Step 3 — Fill in {selectedForm ? String(selectedForm.name ?? selectedForm.title ?? 'Form') : 'Form'}</h2>
          <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: 20 }}>
            These fields come from the Wizlo form schema (
            <code style={{ fontSize: '0.8rem', background: '#f7fafc', padding: '1px 4px', borderRadius: 3 }}>
              GET /forms/{'{id}'}/schema
            </code>
            ). Fill them in below — your app owns this UI.
            Fields marked <span style={{ color: '#2b6cb0', fontWeight: 600 }}>PHI</span> will
            be written back to the patient's record in Wizlo upon submission.
          </p>

          {/* Dynamic fields rendered from the schema */}
          {schema && renderFields(schema.fieldSchema ?? [], fieldValues, setFieldValues)}

          {schema && !schema.payloadTemplate && (
            <div className="error-box" style={{ marginTop: 16 }}>
              Form schema loaded but payload template is missing. Please go back and re-select the form.
            </div>
          )}

          {submitError && <div className="error-box" style={{ marginTop: 16 }}>{submitError}</div>}

          <div className="nav-buttons">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !schema || !schema.payloadTemplate}
            >
              {submitting ? <span className="spinner" /> : 'Submit to Wizlo →'}
            </button>
          </div>
        </div>
      )}

      {/* ─── SUCCESS ──────────────────────────────────────────────────── */}
      {submitResult && (
        <div className="card">
          <div className="success-box">
            Form submitted successfully to Wizlo!
          </div>

          {/* Key result fields shown prominently */}
          <SubmitResultSummary result={submitResult} />

          {/* Full raw response for reference */}
          <div className="result-box" style={{ marginTop: 20 }}>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.875rem' }}>Raw API response:</p>
            <pre>{JSON.stringify(submitResult, null, 2)}</pre>
          </div>

          <button
            className="btn btn-secondary"
            style={{ marginTop: 20 }}
            onClick={() => {
              setStep(1);
              setSelectedPatient(null);
              setSelectedForm(null);
              setSchema(null);
              setFieldValues({});
              setSubmitResult(null);
              setPatients([]);
              setEmailSearch('');
            }}
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Field renderer ──────────────────────────────────────────────────────────

/**
 * renderFields — dynamically renders one input for each field in `fieldSchema`.
 *
 * Fields are grouped by pageContext (page number) so multi-page forms look
 * organised. For each field we render:
 *  - The label (with a required marker and a PHI badge if isPHI=true)
 *  - A standard <input>, <textarea>, or <select> based on the field type
 *  - A small hint explaining what PHI means
 *
 * The `fieldValues` map keyed by fieldName stores what the user has entered.
 * We call `setFieldValues` on every change — keeping all state in the parent.
 */
function renderFields(
  fields: FieldSchema[],
  values: Record<string, string>,
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) {
  // Group by page
  const pages = new Map<number, FieldSchema[]>();
  for (const f of fields) {
    const page = f.pageContext ?? 1;
    if (!pages.has(page)) pages.set(page, []);
    pages.get(page)!.push(f);
  }

  const sorted = [...pages.entries()].sort((a, b) => a[0] - b[0]);

  return sorted.map(([pageNum, pageFields]) => (
    <div key={pageNum}>
      {sorted.length > 1 && (
        <div className="field-group-title">Page {pageNum}</div>
      )}
      {pageFields.map(field => (
        <div key={field.fieldName} className="form-group">
          <label>
            {field.label}
            {field.required && <span className="required"> *</span>}
            {field.isPHI && <span className="phi-badge">PHI</span>}
          </label>

          {/* Textarea for long-text fields */}
          {field.type === 'textarea' ? (
            <textarea
              value={values[field.fieldName] ?? ''}
              onChange={e =>
                setValues(v => ({ ...v, [field.fieldName]: e.target.value }))
              }
              placeholder={`Enter ${field.label.toLowerCase()}…`}
            />
          ) : (
            /* Standard input for everything else */
            <input
              type={inputType(field)}
              value={values[field.fieldName] ?? ''}
              onChange={e =>
                setValues(v => ({ ...v, [field.fieldName]: e.target.value }))
              }
              placeholder={field.required ? `${field.label} (required)` : field.label}
            />
          )}

          {field.isPHI && (
            <p className="hint">
              This value will be saved to the patient&apos;s profile in Wizlo.
            </p>
          )}
        </div>
      ))}
    </div>
  ));
}

// ─── Submit result summary ────────────────────────────────────────────────────

interface SubmitResultShape {
  success?: boolean;
  submissionId?: string;
  patientUpdated?: boolean;
  vitalsRecorded?: boolean;
  formName?: string;
  message?: string;
}

/**
 * Shows the three most useful fields from the Wizlo API response in a clear,
 * readable way so developers can see exactly what happened.
 */
function SubmitResultSummary({ result }: { result: SubmitResultShape }) {
  const rows: [string, string, string][] = [
    ['Submission ID', result.submissionId ?? '—', 'Store this to reference the submission later'],
    ['Patient Updated', result.patientUpdated ? 'Yes' : 'No', 'PHI fields were mapped back to the patient record'],
    ['Vitals Recorded', result.vitalsRecorded ? 'Yes' : 'No', 'Health vitals (BP, weight, height…) were saved'],
  ];

  return (
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>What it means</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value, desc]) => (
          <tr key={label}>
            <td><strong>{label}</strong></td>
            <td>{value}</td>
            <td style={{ color: '#718096', fontSize: '0.8125rem' }}>{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
