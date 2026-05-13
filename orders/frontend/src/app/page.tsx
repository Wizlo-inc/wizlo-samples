'use client';
import { useState } from 'react';
import { createOrder, getSubscriptionOrders } from '@/lib/api';

interface Order {
  id?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export default function OrdersPage() {
  const [patientId, setPatientId] = useState('49f623c9-0fc3-4e66-9b5e-56c955a71e43');
  const [productOfferId, setProductOfferId] = useState('db6dec31-e0b9-4b5f-bd1f-0bd0a53ff96f');
  const [qty, setQty] = useState(1);
  const [serviceQueue, setServiceQueue] = useState('internal_staff');
  const [reviewType, setReviewType] = useState('asynchronous');
  const [source, setSource] = useState('CLINIC');
  const [orderResult, setOrderResult] = useState<unknown>(null);
  const [orderError, setOrderError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  const [subscriptionId, setSubscriptionId] = useState('');
  const [subOrders, setSubOrders] = useState<Order[] | null>(null);
  const [subError, setSubError] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);
    setOrderResult(null);
    setOrderError('');
    try {
      const result = await createOrder({ patientId, productOfferId, qty, serviceQueue, reviewType, source });
      setOrderResult(result);
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleFetchSubOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionId.trim()) return;
    setSubLoading(true);
    setSubOrders(null);
    setSubError('');
    try {
      const data = await getSubscriptionOrders(subscriptionId.trim());
      setSubOrders(Array.isArray(data) ? data : (data?.orders ?? [data]));
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubLoading(false);
    }
  };

  const orderRes = orderResult as Record<string, unknown> | null;

  return (
    <div className="container">
      <h1>Wizlo Orders</h1>
      <p className="subtitle">Create orders and view subscription orders via the Wizlo API.</p>

      <div className="card">
        <h2>Create Order</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
          Maps to <code>POST /tenants/orders</code> on the Wizlo API.
        </p>
        <form onSubmit={handleCreateOrder}>
          <div className="form-section-title">Patient &amp; Product</div>
          <div className="form-group">
            <label>Patient ID *</label>
            <input
              type="text"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              placeholder="Patient UUID from Wizlo"
              required
            />
          </div>
          <div className="form-group">
            <label>Product Offer ID *</label>
            <input
              type="text"
              value={productOfferId}
              onChange={e => setProductOfferId(e.target.value)}
              placeholder="Product offer UUID from Wizlo"
              required
            />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={e => setQty(Number(e.target.value))}
            />
          </div>

          <div className="form-section-title" style={{ marginTop: '24px' }}>Order Configuration</div>
          <div className="form-group">
            <label>Service Queue</label>
            <select value={serviceQueue} onChange={e => setServiceQueue(e.target.value)}>
              <option value="internal_staff">internal_staff — handled by clinic staff</option>
              <option value="provider_network">provider_network — routed to provider network</option>
            </select>
          </div>
          <div className="form-group">
            <label>Review Type</label>
            <select value={reviewType} onChange={e => setReviewType(e.target.value)}>
              <option value="asynchronous">asynchronous — reviewed at provider&apos;s convenience</option>
              <option value="synchronous">synchronous — real-time review session</option>
            </select>
          </div>
          <div className="form-group">
            <label>Source</label>
            <select value={source} onChange={e => setSource(e.target.value)}>
              <option value="CLINIC">CLINIC — order initiated from clinic</option>
              <option value="FORMS">FORMS — order initiated from intake form</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={orderLoading}>
            {orderLoading ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>

        {!!orderResult && (
          <div className="result-box">
            <div style={{ marginBottom: '12px' }}>
              <strong>Order Created Successfully</strong>
              {orderRes?.id && (
                <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
                  Order ID: <code>{String(orderRes.id)}</code>
                </div>
              )}
              {orderRes?.status && (
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  Status: <code>{String(orderRes.status)}</code>
                </div>
              )}
            </div>
            <details>
              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>Raw API response</summary>
              <pre style={{ marginTop: '8px' }}>{JSON.stringify(orderResult, null, 2)}</pre>
            </details>
          </div>
        )}
        {orderError && <div className="error-box">{orderError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>View Subscription Orders</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
          Maps to <code>GET /subscriptions/:id/orders</code> on the Wizlo API.
        </p>
        <form onSubmit={handleFetchSubOrders}>
          <div className="form-group">
            <label>Subscription ID *</label>
            <input
              type="text"
              value={subscriptionId}
              onChange={e => setSubscriptionId(e.target.value)}
              placeholder="Enter subscription UUID"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={subLoading}>
            {subLoading ? 'Fetching...' : 'Fetch Orders'}
          </button>
        </form>

        {subOrders !== null && (
          subOrders.length === 0 ? (
            <p className="empty-state">No orders found for this subscription.</p>
          ) : (
            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Status</th><th>Created At</th></tr>
                </thead>
                <tbody>
                  {subOrders.map((o, i) => (
                    <tr key={o.id ?? i}>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{o.id ?? '—'}</td>
                      <td>{o.status ?? '—'}</td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {subError && <div className="error-box">{subError}</div>}
      </div>
    </div>
  );
}
