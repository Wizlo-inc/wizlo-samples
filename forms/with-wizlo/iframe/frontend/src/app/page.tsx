'use client';

/**
 * Iframe Forms — main page
 *
 * This page demonstrates the "iframe forms" pattern:
 *   Wizlo renders the entire form UI inside an <iframe> — your app just embeds it.
 *
 * Two steps + the embedded form:
 *  Step 1 — Patient  : search or create a patient in Wizlo.
 *  Step 2 — Form     : list all published Wizlo forms and pick one.
 *  Embed             : call POST /forms/attach → get embedUrl → render in <iframe>.
 *
 * The parent page communicates with the Wizlo iframe via the browser's
 * postMessage API. Wizlo sends two events:
 *
 *  • wizlo-form-resize
 *      Payload: { type: 'wizlo-form-resize', height: number }
 *      Wizlo's form height changes as the user moves between pages or errors appear.
 *      We listen for this and update the iframe height so there is no scrollbar
 *      inside the iframe and no clipped content.
 *
 *  • wizlo-form-scroll-top
 *      Payload: { type: 'wizlo-form-scroll-top' }
 *      Wizlo asks the parent to scroll the iframe into view (sent on page transitions).
 *      We call scrollIntoView() on the iframe element.
 *
 * We also listen for a submission-complete signal so we can show a success banner
 * on the parent page.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPatients, createPatient, getForms, attachForm, checkFormCompatible } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = Record<string, unknown> & { id: string };
type Form    = Record<string, unknown> & { id: string; name?: string; title?: string };

interface AttachResult {
  formId: string;
  embedUrl: string;
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

const STEPS = ['Patient', 'Form', 'Fill (Wizlo UI)'];

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

// ─── Main component ────────────────────────────────────────────────────────────

export default function IframeFormsPage() {
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
  // keyed by form.id — null means check still in progress
  const [compatibility, setCompatibility] = useState<
    Record<string, {
      compatible: boolean;
      status: 'ready' | 'needs_setup' | 'missing_phi' | 'error';
      message: string;
    } | null>
  >({});

  // ── Embed state ──
  const [attaching, setAttaching] = useState(false);
  const [attachResult, setAttachResult] = useState<AttachResult | null>(null);
  const [iframeHeight, setIframeHeight] = useState(640);   // initial px height of the iframe
  const [iframeLoaded, setIframeLoaded] = useState(false); // hide the spinner once loaded
  const [formCompleted, setFormCompleted] = useState(false);

  // ── Generic loading / error ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // postMessage listener
  //
  // Wizlo's form iframe communicates back to the parent page by calling
  // window.parent.postMessage(event, '*') with structured objects.
  //
  // We handle three events here:
  //
  //  1. wizlo-form-resize      → update iframe height dynamically
  //  2. wizlo-form-scroll-top  → scroll the iframe into view (called on page transitions)
  //  3. wizlo-form-complete    → the user submitted the form successfully
  //
  // We register one listener on mount and clean it up on unmount.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only process messages that have a `type` string — ignore unrelated events
      if (!event.data || typeof event.data !== 'object') return;

      const { type, height } = event.data as { type?: string; height?: number };

      if (type === 'wizlo-form-resize') {
        // The form's content height changed (e.g. user moved to a new page,
        // a validation error appeared, or an accordion expanded).
        // Update the iframe height so the content is never clipped or scroll-boxed.
        if (typeof height === 'number' && height > 0) {
          setIframeHeight(height);
        }
      } else if (type === 'wizlo-form-scroll-top') {
        // The form navigated to a new page and wants the parent to scroll up
        // so the top of the form is visible (not cut off by a sticky header).
        iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (type === 'wizlo-form-complete') {
        // The user finished and submitted the form.
        // Wizlo sends this so the parent page can show a thank-you message,
        // redirect the user, or trigger downstream logic.
        setFormCompleted(true);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 handlers
  // ─────────────────────────────────────────────────────────────────────────

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

  const handleSelectPatient = useCallback(async (p: Patient) => {
    setSelectedPatient(p);
    setStep(2);
    loadForms();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 handlers
  // ─────────────────────────────────────────────────────────────────────────

  const loadForms = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getForms();
      const list = data as Form[];
      setForms(list);

      // Pre-check iframe compatibility for every form in parallel.
      // Each check calls GET /forms/:id/compatible which inspects the form schema
      // for phi_email, phi_first_name, phi_last_name — the fields Wizlo requires
      // before it will create a public embed token.
      // We initialise all entries to null (loading) then fill them as results arrive.
      setCompatibility(
        Object.fromEntries(list.map((f) => [f.id, null])),
      );
      list.forEach((f) => {
        checkFormCompatible(f.id).then((result) => {
          setCompatibility((prev) => ({ ...prev, [f.id]: result }));
        });
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * When the user picks a form, call POST /forms/attach on the backend.
   *
   * The backend calls the Wizlo API which:
   *  1. Creates a new UserFormInvitation record (tracking the instance of this form fill)
   *  2. Generates a hashed token unique to this invitation
   *  3. Returns an embedUrl of the shape:
   *       https://app.wizlo.com/form-submission?token=<bcrypt-hash>
   *
   * We store the embedUrl in state and render it in the <iframe>.
   * The token is bcrypt-hashed so even if someone intercepts the URL they cannot
   * enumerate or forge other invitations.
   */
  const handleSelectForm = useCallback(async (form: Form) => {
    setSelectedForm(form);
    setError('');
    setAttaching(true);
    setAttachResult(null);
    setIframeLoaded(false);
    setFormCompleted(false);
    setIframeHeight(640);

    try {
      const result = await attachForm(form.id, selectedPatient!.id);
      setAttachResult(result);
      setStep(3);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Failed to create embed URL';
      // Wizlo requires forms to have phi_email, phi_first_name, phi_last_name fields
      // before they can be embedded publicly. Surface a clear explanation.
      let msg = raw;
      if (raw.toLowerCase().includes('missing required fields') || raw.toLowerCase().includes('missing_phi')) {
        msg = 'This form is missing the required patient identification fields ' +
          '(phi_email, phi_first_name, phi_last_name). Add them in the Wizlo form builder and republish.';
      } else if (raw.toLowerCase().includes('foreign key') || raw.toLowerCase().includes('failed to share') || raw.toLowerCase().includes('fk')) {
        msg = 'This form has the required fields but no public embed link yet. ' +
          'Go to Wizlo dashboard → Forms → [this form] → Share → Get Public Link, then try again.';
      }
      setError(msg);
    } finally {
      setAttaching(false);
    }
  }, [selectedPatient]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container">
      <h1>Iframe Forms</h1>
      <p className="subtitle">
        Pick a form and Wizlo renders its own UI inside an embedded iframe.
        Your app just provides the wrapper — Wizlo handles all the form logic.
      </p>

      <StepBar current={step} />

      {/* ─── STEP 1 — Patient ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <h2>Step 1 — Find or Create Patient</h2>
          <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: 20 }}>
            Every Wizlo form embed is linked to a patient record.
            Search by email to find an existing one, or create a new one.
          </p>

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
                      <button className="btn btn-secondary btn-sm" onClick={() => handleSelectPatient(p)}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

          <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateForm(v => !v)}>
            {showCreateForm ? 'Hide' : '+ Create new patient'}
          </button>

          {showCreateForm && (
            <div style={{ marginTop: 16 }}>
              <div className="row-2">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input type="text" value={newPatient.firstName}
                    onChange={e => setNewPatient(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input type="text" value={newPatient.lastName}
                    onChange={e => setNewPatient(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input type="email" value={newPatient.email}
                  onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCreatePatient}
                disabled={loading || !newPatient.firstName || !newPatient.lastName || !newPatient.email}
              >
                {loading ? <span className="spinner" /> : 'Create Patient'}
              </button>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}
        </div>
      )}

      {/* ─── STEP 2 — Select Form ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="card">
          {selectedPatient && (
            <div className="patient-chip" style={{ marginBottom: 20 }}>
              <span>
                Patient: <strong>{String(selectedPatient.firstName ?? '')} {String(selectedPatient.lastName ?? '')}</strong>
                {' '}— {String(selectedPatient.email ?? '')}
              </span>
              <button onClick={() => { setStep(1); setSelectedForm(null); setAttachResult(null); }}>×</button>
            </div>
          )}

          <h2>Step 2 — Pick a Form</h2>
          <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: 20 }}>
            Selecting a form calls <code style={{ fontSize: '0.8rem', background: '#f7fafc', padding: '1px 4px', borderRadius: 3 }}>POST /forms/attach</code> on the backend,
            which creates a unique embed URL for this form instance. The URL is then rendered in an iframe.
          </p>

          {loading && <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>}

          {attaching && (
            <div className="info-box">Generating embed URL…</div>
          )}

          {!loading && forms.length === 0 && (
            <div className="empty-state">No published forms found. Publish a form in Wizlo first.</div>
          )}

          {forms.map(f => {
            const compat = compatibility[f.id]; // null = still checking
            const isIncompatible = compat !== null && compat !== undefined && !compat.compatible;
            return (
              <div
                key={f.id}
                className={`form-card ${selectedForm?.id === f.id ? 'selected' : ''} ${isIncompatible ? 'incompatible' : ''}`}
                onClick={() => !attaching && handleSelectForm(f)}
                style={{ opacity: isIncompatible ? 0.6 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="form-name">{String(f.name ?? f.title ?? 'Untitled Form')}</div>

                  {/* Compatibility badge — shown once the check resolves */}
                  {compat === null && (
                    <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>checking…</span>
                  )}
                  {compat?.status === 'ready' && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      background: '#f0fff4', color: '#276749',
                      border: '1px solid #c6f6d5', borderRadius: 4, padding: '2px 7px',
                    }}>
                      ✓ ready to embed
                    </span>
                  )}
                  {compat?.status === 'needs_setup' && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      background: '#fffbeb', color: '#92400e',
                      border: '1px solid #fde68a', borderRadius: 4, padding: '2px 7px',
                    }}>
                      ⚠ needs dashboard setup
                    </span>
                  )}
                  {compat?.status === 'missing_phi' && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      background: '#fff5f5', color: '#c53030',
                      border: '1px solid #fed7d7', borderRadius: 4, padding: '2px 7px',
                    }}>
                      ✗ missing PHI fields
                    </span>
                  )}
                </div>

                <div className="form-meta" style={{ marginTop: 4 }}>
                  ID: {f.id}
                  {compat && !compat.compatible && (
                    <span style={{ marginLeft: 8, color: compat.status === 'needs_setup' ? '#92400e' : '#c53030', fontSize: '0.75rem' }}>
                      — {compat.message}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {error && <div className="error-box">{error}</div>}

          <div className="nav-buttons">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
          </div>
        </div>
      )}

      {/* ─── STEP 3 — Embedded Wizlo form ─────────────────────────────── */}
      {step === 3 && attachResult && (
        <>
          {/* Context bar above the iframe */}
          <div className="card" style={{ marginBottom: 12 }}>
            {selectedPatient && (
              <div className="patient-chip" style={{ marginBottom: 12 }}>
                <span>
                  Patient: <strong>{String(selectedPatient.firstName ?? '')} {String(selectedPatient.lastName ?? '')}</strong>
                </span>
              </div>
            )}
            <div className="info-box" style={{ marginBottom: 0 }}>
              <strong>Wizlo is now in control of the form UI.</strong>
              {' '}The user fills and submits the form entirely inside the iframe below.
              Your app receives a <code>wizlo-form-complete</code> postMessage event when they finish.
            </div>
          </div>

          {/* Success banner — shown when Wizlo fires the completion postMessage */}
          {formCompleted && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                padding: '16px 20px', borderRadius: 8,
                background: '#f0fff4', border: '1px solid #c6f6d5', color: '#276749',
              }}>
                <strong>Form submitted!</strong> Wizlo fired the <code>wizlo-form-complete</code> event.
                The submission is now stored in Wizlo — you can view it in the Wizlo dashboard
                or query it via <code>GET /forms/submissions/list</code>.
              </div>
            </div>
          )}

          {/* The iframe card */}
          <div className="card-flush">
            {/* Header strip showing the embed URL */}
            <div className="iframe-header">
              <span style={{ fontWeight: 500 }}>
                {selectedForm ? String(selectedForm.name ?? selectedForm.title ?? 'Form') : 'Form'}
              </span>
              <span className="embed-url" title={attachResult.embedUrl}>
                {attachResult.embedUrl}
              </span>
            </div>

            {/* iframe wrapper — height is controlled by wizlo-form-resize postMessages */}
            <div className="iframe-wrapper" style={{ height: iframeHeight }}>
              {/* Loading overlay — hidden once the iframe fires the onLoad event */}
              {!iframeLoaded && (
                <div className="iframe-loading">
                  <span className="spinner spinner-lg" />
                  <span>Loading Wizlo form…</span>
                </div>
              )}

              {/*
               * The iframe itself.
               *
               * Key attributes:
               *  src        — the embedUrl returned by POST /forms/attach
               *  scrolling  — "no" because we manage height via postMessage instead;
               *               an inner scrollbar inside the iframe looks bad
               *  style      — full-width, no border; height is managed by iframeHeight state
               *
               * Security note: the form is served from Wizlo's domain.
               * The token in the URL is bcrypt-hashed — each invite has a unique token
               * so they cannot be enumerated or reused.
               */}
              <iframe
                ref={iframeRef}
                src={attachResult.embedUrl}
                onLoad={() => setIframeLoaded(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                  overflow: 'hidden',   // replaces deprecated scrolling="no"
                  opacity: iframeLoaded ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}
                title="Wizlo Form"
                // allow="camera" — uncomment if the form uses the Vouched IDV camera widget
              />
            </div>

            {/* Footer strip with tracking IDs for reference */}
            <div className="meta-row">
              <span><strong>Form ID:</strong> {attachResult.formId}</span>
              <span style={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                Public link — generated via GET /forms/public-link/:formId
              </span>
            </div>
          </div>

          {/* Back button */}
          <button className="btn btn-secondary" onClick={() => {
            setStep(2);
            setAttachResult(null);
            setFormCompleted(false);
          }}>
            ← Pick a different form
          </button>
        </>
      )}
    </div>
  );
}
