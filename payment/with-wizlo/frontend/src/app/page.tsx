'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const Gr4vyPayment = dynamic(() => import('@/components/Gr4vyPayment'), { ssr: false });

const PLANS = [
  { id: '1-month', name: '1 Month', price: '$99', period: '/mo', badge: null },
  { id: '3-month', name: '3 Months', price: '$79', period: '/mo', badge: 'Most Popular' },
  { id: '6-month', name: '6 Months', price: '$59', period: '/mo', badge: 'Best Value' },
];

const PLAN_AMOUNTS: Record<string, number> = {
  '1-month': 9900,
  '3-month': 7900,
  '6-month': 5900,
};

export default function PaymentPage() {
  const [patientId, setPatientId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('3-month');
  const [loading, setLoading] = useState(false);
  const [embedToken, setEmbedToken] = useState<string | null>(null);
  const [gr4vySubmit, setGr4vySubmit] = useState<(() => void) | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;
    setLoading(true);
    setEmbedToken(null);

    try {
      const res = await fetch('http://localhost:3005/payments/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PLAN_AMOUNTS[selectedPlan],
          currency: 'USD',
          buyerExternalIdentifier: patientId.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to get payment token');
      const { token } = await res.json();
      setEmbedToken(token);
    } catch {
      // token fetch failed silently
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (_transaction: any) => {
    setEmbedToken(null);
    setPaymentComplete(true);
  };

  const handleReset = () => {
    setPaymentComplete(false);
    setPatientId('');
    setSelectedPlan('3-month');
  };

  return (
    <div className="container">
      <h1>Wizlo Payment</h1>
      <p className="subtitle">Select a plan and complete your payment securely.</p>

      <div className="card">
        <h2>Make a Payment</h2>

        {paymentComplete ? (
          <div className="success-box" style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#d1fae5', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="32" height="32" fill="none" stroke="#059669" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Payment Successful!</h3>
            <p style={{ color: '#666', marginBottom: 24 }}>Your transaction has been processed.</p>
            <button className="btn btn-primary" onClick={handleReset}>Done</button>
          </div>
        ) : !embedToken ? (
          <form onSubmit={handleSubscribe}>
            <div className="form-group">
              <label>Patient ID *</label>
              <input
                type="text"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
                required
              />
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Loading payment...' : 'Subscribe'}
            </button>
          </form>
        ) : (
          <div>
            <p style={{ marginBottom: 12 }}>
              Complete your payment for the <strong>{selectedPlan}</strong> plan
            </p>
            <Gr4vyPayment
              token={embedToken}
              amount={PLAN_AMOUNTS[selectedPlan]}
              merchantAccountId="merchant-47a04580"
              buyerExternalIdentifier={patientId}
              onComplete={handlePaymentComplete}
              onReady={(fn) => setGr4vySubmit(() => fn)}
            />
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => gr4vySubmit?.()}
              >
                Pay Now
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEmbedToken(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
