'use client';
import { useState } from 'react';
import {
  getClients, createPatient, updatePatient,
  getForms, getFormDetail,
  submitIntake,
} from '@/lib/api';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'];
const HEALTH_GOALS = ['Lose weight', 'Gain muscle', 'Improve energy', 'Better sleep', 'Hormonal balance', 'Anti-aging', 'Improved libido', 'Skin health', 'Mental clarity', 'General wellness'];
const MEDICAL_CONDITIONS = ['Diabetes', 'Heart disease', 'High blood pressure', 'Thyroid disorder', 'Kidney disease', 'Liver disease', 'Cancer (current/past)', 'None of the above'];
const SMOKING_OPTIONS = ['Never', 'Former', 'Current'];
const ALCOHOL_OPTIONS = ['Never', 'Rarely', 'Occasionally', 'Regularly'];
const STEP_LABELS = ['Patient', 'Select Form', 'Health Info', 'Review'];

interface Patient { id: string; firstName: string; lastName: string; email: string; }
interface WizloForm { id: string; name: string; description?: string; status?: string; }
interface HealthData {
  fullName: string; dateOfBirth: string; gender: string;
  heightFt: string; heightIn: string; weightLbs: string;
  activityLevel: string; healthGoals: string[];
  medicalConditions: string[]; currentMedications: string;
  allergies: string; smokingStatus: string; alcoholUse: string;
}

export default function IntakeFormPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<unknown>(null);

  // Step 1 — Patient
  const [searchEmail, setSearchEmail] = useState('');
  const [searchDone, setSearchDone] = useState(false);
  const [foundPatients, setFoundPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientMode, setPatientMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [patientForm, setPatientForm] = useState({ firstName: '', lastName: '', email: '' });

  // Step 2 — Form selection
  const [forms, setForms] = useState<WizloForm[]>([]);
  const [formsLoaded, setFormsLoaded] = useState(false);
  const [selectedForm, setSelectedForm] = useState<WizloForm | null>(null);
  const [formDetail, setFormDetail] = useState<unknown>(null);

  // Step 3 — Health info
  const [hd, setHd] = useState<HealthData>({
    fullName: '', dateOfBirth: '', gender: '',
    heightFt: '', heightIn: '0', weightLbs: '',
    activityLevel: '', healthGoals: [],
    medicalConditions: [], currentMedications: '',
    allergies: '', smokingStatus: '', alcoholUse: '',
  });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedTelehealth, setAgreedTelehealth] = useState(false);

  const setH = (key: keyof HealthData, val: string | string[]) =>
    setHd(p => ({ ...p, [key]: val }));
  const toggleH = (key: 'healthGoals' | 'medicalConditions', val: string) =>
    setHd(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val] }));

  const handleSearch = async () => {
    if (!searchEmail.trim()) { setError('Enter an email to search.'); return; }
    setLoading(true); setError(''); setSearchDone(false);
    try {
      const results = await getClients(searchEmail.trim()) as Patient[];
      setFoundPatients(results);
      setSearchDone(true);
      if (results.length === 0) {
        setPatientMode('create');
        setPatientForm(p => ({ ...p, email: searchEmail.trim() }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientMode('idle');
    setHd(prev => ({ ...prev, fullName: `${p.firstName} ${p.lastName}` }));
  };

  const handleCreatePatient = async () => {
    if (!patientForm.firstName || !patientForm.lastName || !patientForm.email) {
      setError('All patient fields are required.'); return;
    }
    setLoading(true); setError('');
    try {
      const p = await createPatient(patientForm) as Patient;
      setSelectedPatient(p);
      setFoundPatients([p]);
      setPatientMode('idle');
      setHd(prev => ({ ...prev, fullName: `${p.firstName} ${p.lastName}` }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create patient failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;
    setLoading(true); setError('');
    try {
      const updated = await updatePatient(selectedPatient.id, patientForm) as Patient;
      setSelectedPatient(updated);
      setFoundPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
      setPatientMode('idle');
      setHd(prev => ({ ...prev, fullName: `${updated.firstName} ${updated.lastName}` }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update patient failed');
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async () => {
    if (formsLoaded) return;
    setLoading(true); setError('');
    try {
      const list = await getForms() as WizloForm[];
      setForms(list);
      setFormsLoaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = async (form: WizloForm) => {
    setLoading(true); setError('');
    try {
      const detail = await getFormDetail(form.id);
      setSelectedForm(form);
      setFormDetail(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load form detail');
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    setError('');
    if (step === 1) {
      if (!selectedPatient) { setError('Please select or create a patient first.'); return; }
      setStep(2);
      await loadForms();
    } else if (step === 2) {
      if (!selectedForm) { setError('Please select a form.'); return; }
      setStep(3);
    } else if (step === 3) {
      if (!hd.fullName || !hd.dateOfBirth || !hd.gender) {
        setError('Name, Date of Birth, and Gender are required.'); return;
      }
      if (!hd.heightFt || !hd.weightLbs || !hd.activityLevel) {
        setError('Height, Weight, and Activity Level are required.'); return;
      }
      if (!hd.smokingStatus || !hd.alcoholUse) {
        setError('Smoking and Alcohol status are required.'); return;
      }
      setStep(4);
    }
  };

  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!agreedTerms || !agreedTelehealth) {
      setError('Please agree to both Terms of Service and Telehealth consent.'); return;
    }

    // Extract patient ID — Wizlo returns it as `user_id`
    const raw = selectedPatient as unknown as Record<string, unknown>;
    const patientId = (raw?.user_id || raw?.id || raw?.clientId || raw?.patientId) as string | undefined;
    console.log('[handleSubmit] selectedPatient:', selectedPatient);
    console.log('[handleSubmit] resolved patientId:', patientId);

    if (!patientId) {
      setError(
        `Patient ID not found. Available fields on patient object: [${Object.keys(raw ?? {}).join(', ')}]. ` +
        'Please check the browser console and share this with your developer.'
      );
      return;
    }

    setLoading(true); setError('');
    try {
      const structure = {
        pages: [{
          id: 'page_intake',
          rows: [
            { id: 'row_name', order: 0, fields: [{ name: 'full_name', label: 'Full Name', value: hd.fullName }] },
            { id: 'row_dob', order: 1, fields: [{ name: 'date_of_birth', label: 'Date of Birth', value: hd.dateOfBirth }] },
            { id: 'row_gender', order: 2, fields: [{ name: 'gender', label: 'Gender', value: hd.gender }] },
            { id: 'row_height', order: 3, fields: [{ name: 'height', label: 'Height', value: `${hd.heightFt}ft ${hd.heightIn}in` }] },
            { id: 'row_weight', order: 4, fields: [{ name: 'weight_lbs', label: 'Weight (lbs)', value: hd.weightLbs }] },
            { id: 'row_activity', order: 5, fields: [{ name: 'activity_level', label: 'Activity Level', value: hd.activityLevel }] },
            { id: 'row_goals', order: 6, fields: [{ name: 'health_goals', label: 'Health Goals', value: hd.healthGoals.join(', ') }] },
            { id: 'row_conditions', order: 7, fields: [{ name: 'medical_conditions', label: 'Medical Conditions', value: hd.medicalConditions.join(', ') }] },
            { id: 'row_meds', order: 8, fields: [{ name: 'current_medications', label: 'Current Medications', value: hd.currentMedications }] },
            { id: 'row_allergies', order: 9, fields: [{ name: 'allergies', label: 'Allergies', value: hd.allergies }] },
            { id: 'row_smoking', order: 10, fields: [{ name: 'smoking_status', label: 'Smoking Status', value: hd.smokingStatus }] },
            { id: 'row_alcohol', order: 11, fields: [{ name: 'alcohol_use', label: 'Alcohol Use', value: hd.alcoholUse }] },
          ],
        }],
      };
      const result = await submitIntake({
        formId: selectedForm!.id,
        patientId,
        structure,
      });
      setSubmitResult(result);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <h1>Intake Submitted</h1>
        <div className="success-box">Your intake form has been successfully submitted to Wizlo.</div>
        <div className="card">
          <h2>Summary</h2>
          <div className="result-box">
            {[
              ['Patient', `${selectedPatient?.firstName} ${selectedPatient?.lastName} (${selectedPatient?.email})`],
              ['Form', selectedForm?.name ?? ''],
              ['Name', hd.fullName], ['DOB', hd.dateOfBirth], ['Gender', hd.gender],
              ['Height', `${hd.heightFt}ft ${hd.heightIn}in`], ['Weight', `${hd.weightLbs} lbs`],
              ['Activity', hd.activityLevel], ['Goals', hd.healthGoals.join(', ') || 'None'],
              ['Conditions', hd.medicalConditions.join(', ') || 'None'],
              ['Smoking', hd.smokingStatus], ['Alcohol', hd.alcoholUse],
            ].map(([k, v]) => <p key={k}><strong>{k}:</strong> {v}</p>)}
          </div>
        </div>
        {!!submitResult && (
          <div className="card">
            <h2>API Response</h2>
            <div className="result-box"><pre>{JSON.stringify(submitResult, null, 2)}</pre></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Patient Intake Form</h1>
      <p className="subtitle">Complete all steps to submit your health information to Wizlo.</p>

      <div className="steps">
        {STEP_LABELS.flatMap((label, idx) => {
          const items = [
            <div key={`s${idx}`} className="step">
              <div className={`step-circle${step === idx + 1 ? ' active' : step > idx + 1 ? ' done' : ''}`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </div>
              <span className={`step-label${step === idx + 1 ? ' active' : ''}`}>{label}</span>
            </div>,
          ];
          if (idx < STEP_LABELS.length - 1) items.push(<div key={`l${idx}`} className="step-line" />);
          return items;
        })}
      </div>

      {/* STEP 1 — PATIENT */}
      {step === 1 && (
        <div className="card">
          <h2>Find or Create Patient</h2>
          <div className="form-group">
            <label>Search by Email</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                placeholder="patient@example.com"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchDone && foundPatients.length > 0 && (
            <div className="form-group">
              <label>Found Patient(s)</label>
              {foundPatients.map(p => (
                <div key={p.id} className="result-box" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>{p.firstName} {p.lastName}</strong> — {p.email}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={`btn ${selectedPatient?.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSelectPatient(p)}
                    >
                      {selectedPatient?.id === p.id ? 'Selected' : 'Select'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientMode('edit');
                        setPatientForm({ firstName: p.firstName, lastName: p.lastName, email: p.email });
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchDone && foundPatients.length === 0 && patientMode !== 'create' && (
            <p style={{ color: '#6b7280', fontSize: 14 }}>No patient found. Fill in the details below to create one.</p>
          )}

          {(patientMode === 'create' || patientMode === 'edit') && (
            <div className="form-group">
              <label>{patientMode === 'create' ? 'New Patient Details' : 'Edit Patient'}</label>
              <div className="row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" value={patientForm.firstName} onChange={e => setPatientForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane" />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input type="text" value={patientForm.lastName} onChange={e => setPatientForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={patientForm.email} onChange={e => setPatientForm(p => ({ ...p, email: e.target.value }))} placeholder="patient@example.com" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={patientMode === 'create' ? handleCreatePatient : handleUpdatePatient}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : patientMode === 'create' ? 'Create Patient' : 'Update Patient'}
                </button>
                {patientMode === 'edit' && (
                  <button type="button" className="btn btn-secondary" onClick={() => setPatientMode('idle')}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedPatient && patientMode === 'idle' && (
            <div className="success-box" style={{ marginTop: 12 }}>
              Selected: <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.email})
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — SELECT FORM */}
      {step === 2 && (
        <div className="card">
          <h2>Select Intake Form</h2>
          {loading && <p style={{ color: '#6b7280' }}>Loading forms...</p>}
          {!loading && formsLoaded && forms.length === 0 && (
            <p style={{ color: '#6b7280' }}>No published forms found.</p>
          )}
          {forms.map(form => (
            <div
              key={form.id}
              className="result-box"
              style={{
                marginBottom: 12,
                cursor: 'pointer',
                border: selectedForm?.id === form.id ? '2px solid #3b82f6' : undefined,
              }}
              onClick={() => handleSelectForm(form)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{form.name}</strong>
                  {form.description && <p style={{ marginTop: 4, color: '#6b7280', fontSize: 14 }}>{form.description}</p>}
                </div>
                {selectedForm?.id === form.id && (
                  <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', marginLeft: 12 }}>Selected</span>
                )}
              </div>
            </div>
          ))}
          {!!formDetail && !!selectedForm && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 8 }}>Form Details: {selectedForm.name}</h3>
              <div className="result-box">
                <pre style={{ fontSize: 12, overflow: 'auto' }}>{JSON.stringify(formDetail, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — HEALTH INFO */}
      {step === 3 && (
        <div className="card">
          <h2>Health Information</h2>

          <h3 style={{ marginTop: 0, marginBottom: 12, color: '#374151', fontSize: 16 }}>Personal Information</h3>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" value={hd.fullName} onChange={e => setH('fullName', e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Date of Birth *</label>
            <input type="date" value={hd.dateOfBirth} onChange={e => setH('dateOfBirth', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Gender *</label>
            <div className="btn-group">
              {GENDER_OPTIONS.map(opt => (
                <button key={opt} type="button" className={`btn-option${hd.gender === opt ? ' active' : ''}`} onClick={() => setH('gender', opt)}>{opt}</button>
              ))}
            </div>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 12, color: '#374151', fontSize: 16 }}>Health Profile</h3>
          <div className="row">
            <div className="form-group">
              <label>Height (ft) *</label>
              <input type="number" value={hd.heightFt} onChange={e => setH('heightFt', e.target.value)} min={3} max={8} />
            </div>
            <div className="form-group">
              <label>Height (in)</label>
              <input type="number" value={hd.heightIn} onChange={e => setH('heightIn', e.target.value)} min={0} max={11} />
            </div>
            <div className="form-group">
              <label>Weight (lbs) *</label>
              <input type="number" value={hd.weightLbs} onChange={e => setH('weightLbs', e.target.value)} min={50} />
            </div>
          </div>
          <div className="form-group">
            <label>Activity Level *</label>
            <div className="btn-group">
              {ACTIVITY_LEVELS.map(opt => (
                <button key={opt} type="button" className={`btn-option${hd.activityLevel === opt ? ' active' : ''}`} onClick={() => setH('activityLevel', opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Health Goals</label>
            <div className="checkbox-group">
              {HEALTH_GOALS.map(goal => (
                <label key={goal} className="checkbox-item">
                  <input type="checkbox" checked={hd.healthGoals.includes(goal)} onChange={() => toggleH('healthGoals', goal)} />
                  {goal}
                </label>
              ))}
            </div>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 12, color: '#374151', fontSize: 16 }}>Medical History</h3>
          <div className="form-group">
            <label>Medical Conditions</label>
            <div className="checkbox-group">
              {MEDICAL_CONDITIONS.map(cond => (
                <label key={cond} className="checkbox-item">
                  <input type="checkbox" checked={hd.medicalConditions.includes(cond)} onChange={() => toggleH('medicalConditions', cond)} />
                  {cond}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Current Medications</label>
            <textarea value={hd.currentMedications} onChange={e => setH('currentMedications', e.target.value)} placeholder="List any medications..." />
          </div>
          <div className="form-group">
            <label>Known Allergies</label>
            <input type="text" value={hd.allergies} onChange={e => setH('allergies', e.target.value)} placeholder="e.g. Penicillin, peanuts" />
          </div>
          <div className="form-group">
            <label>Smoking Status *</label>
            <div className="btn-group">
              {SMOKING_OPTIONS.map(opt => (
                <button key={opt} type="button" className={`btn-option${hd.smokingStatus === opt ? ' active' : ''}`} onClick={() => setH('smokingStatus', opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Alcohol Use *</label>
            <div className="btn-group">
              {ALCOHOL_OPTIONS.map(opt => (
                <button key={opt} type="button" className={`btn-option${hd.alcoholUse === opt ? ' active' : ''}`} onClick={() => setH('alcoholUse', opt)}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — REVIEW & SUBMIT */}
      {step === 4 && (
        <div className="card">
          <h2>Review & Confirm</h2>
          <div className="result-box">
            {[
              ['Patient', `${selectedPatient?.firstName} ${selectedPatient?.lastName} (${selectedPatient?.email})`],
              ['Patient ID', (selectedPatient as unknown as Record<string, unknown>)?.id as string || (selectedPatient as unknown as Record<string, unknown>)?.clientId as string || (selectedPatient as unknown as Record<string, unknown>)?.patientId as string || '⚠ not found — see console'],
              ['Form', selectedForm?.name ?? ''],
              ['Name', hd.fullName], ['DOB', hd.dateOfBirth], ['Gender', hd.gender],
              ['Height', `${hd.heightFt}ft ${hd.heightIn}in`], ['Weight', `${hd.weightLbs} lbs`],
              ['Activity', hd.activityLevel], ['Goals', hd.healthGoals.join(', ') || 'None selected'],
              ['Conditions', hd.medicalConditions.join(', ') || 'None selected'],
              ['Medications', hd.currentMedications || 'None'], ['Allergies', hd.allergies || 'None'],
              ['Smoking', hd.smokingStatus], ['Alcohol', hd.alcoholUse],
            ].map(([k, v]) => <p key={k} style={{ marginBottom: 4 }}><strong>{k}:</strong> {v}</p>)}
          </div>
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="checkbox-item">
              <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} />
              I agree to the Terms of Service
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-item">
              <input type="checkbox" checked={agreedTelehealth} onChange={e => setAgreedTelehealth(e.target.checked)} />
              I consent to telehealth services
            </label>
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <div className="nav-buttons">
        {step > 1 && <button type="button" className="btn btn-secondary" onClick={back}>Back</button>}
        {step < 4
          ? <button type="button" className="btn btn-primary" onClick={next} disabled={loading} style={{ marginLeft: 'auto' }}>
              {loading ? 'Loading...' : 'Next'}
            </button>
          : <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginLeft: 'auto' }}>
              {loading ? 'Submitting...' : 'Submit Intake Form'}
            </button>
        }
      </div>
    </div>
  );
}
