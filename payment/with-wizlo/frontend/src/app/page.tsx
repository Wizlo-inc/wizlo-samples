'use client';
import { useState } from 'react';
import { createSubscription, getSubscriptions } from '@/lib/api';

const PLANS = [
  { id: '1-month', name: '1 Month', price: '$99', period: '/mo', badge: null },
  { id: '3-month', name: '3 Months', price: '$79', period: '/mo', badge: 'Most Popular' },
  { id: '6-month', name: '6 Months', price: '$59', period: '/mo', badge: 'Best Value' },
];

export default function PaymentPage() {
  const [patientId, setPatientId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('3-month');
  const [subResult, setSubResult] = useState<unknown>(null);
  const [subError, setSubError] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const [fetchPatientId, setFetchPatientId] = useState('');
  const [subs, setSubs] = useState<unknown[] | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    setSubLoading(true); setSubResult(null); setSubError('');
    try {
      setSubResult(await createSubscription({ patientId: patientId.trim(), planType: selectedPlan }));
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubLoading(false);
    }
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchPatientId.trim()) return;
    setFetchLoading(true); setSubs(null); setFetchError('');
    try {
      const data = await getSubscriptions(fetchPatientId.trim());
      setSubs(Array.isArray(data) ? data : [data]);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFetchLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Wizlo Payment</h1>
      <p className="subtitle">Create subscriptions and view existing ones via the Wizlo API.</p>

      <div className="card">
        <h2>Create Subscription</h2>
        <form onSubmit={handleSubscribe}>
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Enter patient ID" required />
          </div>
          <div className="form-group">
            <label>Select Plan</label>
            <div className="plan-cards">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-card${selectedPlan === plan.id ? ' selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.badge && <span className="badge">{plan.badge}</span>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="price">{plan.price}</div>
                  <div className="period">{plan.period}</div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={subLoading}>
            {subLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {subResult && <div className="result-box"><pre>{JSON.stringify(subResult, null, 2)}</pre></div>}
        {subError && <div className="error-box">{subError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>View Subscriptions</h2>
        <form onSubmit={handleFetch}>
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="text" value={fetchPatientId} onChange={e => setFetchPatientId(e.target.value)} placeholder="Enter patient ID" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={fetchLoading}>
            {fetchLoading ? 'Fetching...' : 'Fetch Subscriptions'}
          </button>
        </form>
        {subs !== null && (
          subs.length === 0
            ? <p className="empty-state">No subscriptions found for this patient.</p>
            : <ul className="subs-list" style={{ marginTop: 16 }}>
                {(subs as Record<string, string>[]).map((s, i) => (
                  <li key={s.id ?? i}>
                    <strong>{s.planType ?? s.plan_type ?? '—'}</strong>
                    {s.status ? ` — ${s.status}` : ''}
                    {s.createdAt ? ` — ${new Date(s.createdAt).toLocaleDateString()}` : ''}
                  </li>
                ))}
              </ul>
        )}
        {fetchError && <div className="error-box">{fetchError}</div>}
      </div>
    </div>
  );
}
