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
      setOrderResult(await createOrder({ patientId, productOfferId, qty }));
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

  return (
    <div className="container">
      <h1>Wizlo Orders</h1>
      <p className="subtitle">Create orders and view subscription orders via the Wizlo API.</p>

      <div className="card">
        <h2>Create Order</h2>
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Product Offer ID *</label>
            <input type="text" value={productOfferId} onChange={e => setProductOfferId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={orderLoading}>
            {orderLoading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
        {orderResult && <div className="result-box"><pre>{JSON.stringify(orderResult, null, 2)}</pre></div>}
        {orderError && <div className="error-box">{orderError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>View Subscription Orders</h2>
        <form onSubmit={handleFetchSubOrders}>
          <div className="form-group">
            <label>Subscription ID *</label>
            <input type="text" value={subscriptionId} onChange={e => setSubscriptionId(e.target.value)} placeholder="Enter subscription ID" required />
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
                  <tr><th>ID</th><th>Status</th><th>Created At</th></tr>
                </thead>
                <tbody>
                  {subOrders.map((o, i) => (
                    <tr key={o.id ?? i}>
                      <td>{o.id ?? '—'}</td>
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
