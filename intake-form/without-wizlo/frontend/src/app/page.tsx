'use client';
import { useState } from 'react';
import { submitIntake, getAllIntakes } from '@/lib/api';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'];
const HEALTH_GOALS = ['Lose weight', 'Gain muscle', 'Improve energy', 'Better sleep', 'Hormonal balance', 'Anti-aging', 'Improved libido', 'Skin health', 'Mental clarity', 'General wellness'];
const MEDICAL_CONDITIONS = ['Diabetes', 'Heart disease', 'High blood pressure', 'Thyroid disorder', 'Kidney disease', 'Liver disease', 'Cancer (current/past)', 'None of the above'];
const SMOKING_OPTIONS = ['Never', 'Former', 'Current'];
const ALCOHOL_OPTIONS = ['Never', 'Rarely', 'Occasionally', 'Regularly'];
const STEP_LABELS = ['Personal Info', 'Health Profile', 'Medical History', 'Review'];

interface FormData {
  fullName: string; dateOfBirth: string; gender: string;
  heightFt: string; heightIn: string; weightLbs: string;
  activityLevel: string; healthGoals: string[];
  medicalConditions: string[]; currentMedications: string;
  allergies: string; smokingStatus: string; alcoholUse: string;
}

export default function IntakeFormPage() {
  const [step, setStep] = useState(1);
  const [fd, setFd] = useState<FormData>({
    fullName: '', dateOfBirth: '', gender: '',
    heightFt: '', heightIn: '0', weightLbs: '',
    activityLevel: '', healthGoals: [],
    medicalConditions: [], currentMedications: '',
    allergies: '', smokingStatus: '', alcoholUse: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<unknown>(null);
  const [allIntakes, setAllIntakes] = useState<unknown[] | null>(null);
  const [allLoading, setAllLoading] = useState(false);

  const set = (key: keyof FormData, val: string | string[]) => setFd(p => ({ ...p, [key]: val }));
  const toggle = (key: 'healthGoals' | 'medicalConditions', val: string) =>
    setFd(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val] }));

  const validate = (): boolean => {
    if (step === 1 && (!fd.fullName || !fd.dateOfBirth || !fd.gender)) {
      setError('Please fill all required fields.'); return false;
    }
    if (step === 2 && (!fd.heightFt || !fd.weightLbs || !fd.activityLevel)) {
      setError('Please fill all required fields.'); return false;
    }
    if (step === 3 && (!fd.smokingStatus || !fd.alcoholUse)) {
      setError('Please select smoking and alcohol status.'); return false;
    }
    setError(''); return true;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const result = await submitIntake({
        full_name: fd.fullName,
        date_of_birth: fd.dateOfBirth,
        gender: fd.gender,
        height_ft: Number(fd.heightFt),
        height_in: Number(fd.heightIn),
        weight_lbs: Number(fd.weightLbs),
        activity_level: fd.activityLevel,
        health_goals: fd.healthGoals,
        medical_conditions: fd.medicalConditions,
        current_medications: fd.currentMedications,
        allergies: fd.allergies,
        smoking_status: fd.smokingStatus,
        alcohol_use: fd.alcoholUse,
      });
      setSubmitResult(result);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = async () => {
    setAllLoading(true);
    try {
      setAllIntakes(await getAllIntakes());
    } catch {
      setAllIntakes([]);
    } finally {
      setAllLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <h1>Intake Submitted</h1>
        <div className="success-box">Your intake form has been saved locally.</div>
        <div className="card">
          <h2>Saved Record</h2>
          <div className="result-box">
            <pre>{JSON.stringify(submitResult, null, 2)}</pre>
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleViewAll} disabled={allLoading}>
          {allLoading ? 'Loading...' : 'View All Submissions'}
        </button>
        {allIntakes && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>All Submissions ({(allIntakes as unknown[]).length})</h2>
            <ul className="subs-list">
              {(allIntakes as Record<string, string>[]).map((item, i) => (
                <li key={item.id ?? i}><strong>{item.full_name}</strong> — {item.date_of_birth} — {item.createdAt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Patient Intake Form</h1>
      <p className="subtitle">Complete all steps to save your health information locally.</p>

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

      {step === 1 && (
        <div className="card">
          <h2>Personal Information</h2>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" value={fd.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Date of Birth *</label>
            <input type="date" value={fd.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Gender *</label>
            <div className="btn-group">
              {GENDER_OPTIONS.map(opt => (
                <button key={opt} type="button" className={`btn-option${fd.gender === opt ? ' active' : ''}`} onClick={() => set('gender', opt)}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>Health Profile</h2>
          <div className="row">
            <div className="form-group">
              <label>Height (ft) *</label>
              <input type="number" value={fd.heightFt} onChange={e => set('heightFt', e.target.value)} min={3} max={8} />
            </div>
            <div className="form-group">
              <label>Height (in)</label>
              <input type="number" value={fd.heightIn} onChange={e => set('heightIn', e.target.value)} min={0} max={11} />
            </div>
            <div className="form-group">
              <label>Weight (lbs) *</label>
              <input type="number" value={fd.weightLbs} onChange={e => set('weightLbs', e.target.value)} min={50} />
            </div>
          </div>
          <div className="form-group">
            <label>Activity Level *</label>
            <div className="btn-group">
              {ACTIVITY_LEVELS.map(opt => (
                <button key={opt} type="button" className={`btn-option${fd.activityLevel === opt ? ' active' : ''}`} onClick={() => set('activityLevel', opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Health Goals</label>
            <div className="checkbox-group">
              {HEALTH_GOALS.map(goal => (
                <label key={goal} className="checkbox-item">
                  <input type="checkbox" checked={fd.healthGoals.includes(goal)} onChange={() => toggle('healthGoals', goal)} />
                  {goal}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2>Medical History</h2>
          <div className="form-group">
            <label>Medical Conditions</label>
            <div className="checkbox-group">
              {MEDICAL_CONDITIONS.map(cond => (
                <label key={cond} className="checkbox-item">
                  <input type="checkbox" checked={fd.medicalConditions.includes(cond)} onChange={() => toggle('medicalConditions', cond)} />
                  {cond}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Current Medications</label>
            <textarea value={fd.currentMedications} onChange={e => set('currentMedications', e.target.value)} placeholder="List any medications..." />
          </div>
          <div className="form-group">
            <label>Known Allergies</label>
            <input type="text" value={fd.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, peanuts" />
          </div>
          <div className="form-group">
            <label>Smoking Status *</label>
            <div className="btn-group">
              {SMOKING_OPTIONS.map(opt => (
                <button key={opt} type="button" className={`btn-option${fd.smokingStatus === opt ? ' active' : ''}`} onClick={() => set('smokingStatus', opt)}>{opt}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Alcohol Use *</label>
            <div className="btn-group">
              {ALCOHOL_OPTIONS.map(opt => (
                <button key={opt} type="button" className={`btn-option${fd.alcoholUse === opt ? ' active' : ''}`} onClick={() => set('alcoholUse', opt)}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h2>Review & Confirm</h2>
          <div className="result-box">
            {[['Name', fd.fullName], ['DOB', fd.dateOfBirth], ['Gender', fd.gender],
              ['Height', `${fd.heightFt}ft ${fd.heightIn}in`], ['Weight', `${fd.weightLbs} lbs`],
              ['Activity', fd.activityLevel], ['Goals', fd.healthGoals.join(', ') || 'None'],
              ['Conditions', fd.medicalConditions.join(', ') || 'None'],
              ['Medications', fd.currentMedications || 'None'], ['Allergies', fd.allergies || 'None'],
              ['Smoking', fd.smokingStatus], ['Alcohol', fd.alcoholUse]
            ].map(([k, v]) => <p key={k} style={{ marginBottom: 4 }}><strong>{k}:</strong> {v}</p>)}
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <div className="nav-buttons">
        {step > 1 && <button type="button" className="btn btn-secondary" onClick={back}>Back</button>}
        {step < 4
          ? <button type="button" className="btn btn-primary" onClick={next} style={{ marginLeft: 'auto' }}>Next</button>
          : <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginLeft: 'auto' }}>
              {loading ? 'Saving...' : 'Submit Intake Form'}
            </button>
        }
      </div>
    </div>
  );
}
