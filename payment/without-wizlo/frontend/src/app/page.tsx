'use client';
import { useState } from 'react';
import { createSubscription, getAllSubscriptions } from '@/lib/api';

const PLANS = [
  { id: '1-month', name: '1 Month', price: '$99', period: '/mo', badge: null },
  { id: '3-month', name: '3 Months', price: '$79', period: '/mo', badge: 'Most Popular' },
  { id: '6-month', name: '6 Months', price: '$59', period: '/mo', badge: 'Best Value' },
];

export default function PaymentPage() {
  const [patientId, setPatientId] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('3-month');
  const [subResult, setSubResult] = useState<unknown>(null);
  const [subError, setSubError] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const [allSubs, setAllSubs] = useState<unknown[] | null>(null);
  const [allLoading, setAllLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    setSubLoading(true); setSubResult(null); setSubError('');
    try {
      setSubResult(await createSubscription({
        patientId: patientId.trim(),
        planType: selectedPlan,
        email: email.trim() || undefined,
      }));
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubLoading(false);
    }
  };

  const handleViewAll = async () => {
    setAllLoading(true);
    try {
      const data = await getAllSubscriptions();
      setAllSubs(Array.isArray(data) ? data : [data]);
    } catch {
      setAllSubs([]);
    } finally {
      setAllLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Payment Plans</h1>
      <p className="subtitle">Select a plan and subscribe. Data is saved locally — no Wizlo API calls.</p>

      <div className="card">
        <h2>Create Subscription</h2>
        <form onSubmit={handleSubscribe}>
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Enter patient ID" required />
          </div>
          <div className="form-group">
            <label>Email (optional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="patient@example.com" />
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
        {subResult && (
          <>
            <div className="success-box" style={{ marginTop: 16 }}>Subscription created successfully.</div>
            <div className="result-box"><pre>{JSON.stringify(subResult, null, 2)}</pre></div>
          </>
        )}
        {subError && <div className="error-box">{subError}</div>}
      </div>

      <div style={{ marginBottom: 24 }}>
        <button type="button" className="btn btn-secondary" onClick={handleViewAll} disabled={allLoading}>
          {allLoading ? 'Loading...' : 'View All Subscriptions'}
        </button>
      </div>

      {allSubs !== null && (
        <div className="card">
          <h2>All Subscriptions ({allSubs.length})</h2>
          {allSubs.length === 0
            ? <p className="empty-state">No subscriptions yet.</p>
            : <ul className="subs-list">
                {(allSubs as Record<string, string>[]).map((s, i) => (
                  <li key={s.id ?? i}>
                    <strong>{s.patientId}</strong> — {s.planType} — {s.status}
                    {s.createdAt ? ` — ${new Date(s.createdAt).toLocaleString()}` : ''}
                  </li>
                ))}
              </ul>
          }
        </div>
      )}
    </div>
  );
}
