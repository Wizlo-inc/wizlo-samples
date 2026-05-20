/**
 * Module:    Refills
 * Workflow:  Frontend — overview
 * File:      app/page.tsx
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <h1>Wizlo Refills</h1>
      <p className="subtitle">
        Walk through the full refill workflow — find refillable encounters, create a refill order,
        and transmit the prescription to the pharmacy.
      </p>

      <div className="card">
        <h2>Workflow Steps</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/eligibility"><strong>Eligibility check</strong></Link> &mdash;{' '}
            <code>GET /tenants/refills/staff/encounters</code> and{' '}
            <code>GET /tenants/refills/staff/encounter/:id/treatments</code>. Find which
            encounters &amp; treatments a patient can refill right now.
          </li>
          <li>
            <Link href="/create-refill"><strong>Create refill order</strong></Link> &mdash;{' '}
            <code>POST /tenants/refills/staff/create</code>. Bundle the chosen{' '}
            <code>encounterTreatmentId</code>s into a single <code>REFILL</code> order.
          </li>
          <li>
            <Link href="/rx-submission"><strong>Rx submission</strong></Link> &mdash;{' '}
            <code>POST /tenants/orders/bulk/mark-paid</code> &rarr;{' '}
            <code>POST /rx/orders/:id/submit-refill-rx</code>. Mark paid (or use your own payment
            flow) and transmit the Rx to the pharmacy.
          </li>
        </ol>
      </div>

      <div className="card">
        <h3>See also &mdash; Edge Cases</h3>
        <p style={{ color: '#4a5568', fontSize: 14 }}>
          Failure-mode handling lives in a separate sample at{' '}
          <code>refills/edgecases/</code> (backend on <code>:3004</code>, frontend on{' '}
          <code>:3014</code>). Covers <code>no_refills_remaining</code> and the days-of-supply
          window, including the staff <code>bypassDaysOfSupply</code> override.
        </p>
      </div>

      <div className="card">
        <h3>Setup checklist</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9, color: '#4a5568', fontSize: 14 }}>
          <li>Backend running on <code>http://localhost:3003</code> with valid Wizlo credentials.</li>
          <li>Frontend running on <code>http://localhost:3013</code> (this app).</li>
          <li>
            A patient UUID that has at least one <em>completed</em> encounter with{' '}
            <em>indicated</em> treatments.
          </li>
        </ul>
      </div>
    </div>
  );
}
