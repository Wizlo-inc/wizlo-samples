'use client';
import { useState } from 'react';
import { listProviderNetworks, type ProviderNetwork } from '@/lib/api';

export default function ProviderNetworkPage() {
  const [networks, setNetworks] = useState<ProviderNetwork[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNetworks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listProviderNetworks();
      setNetworks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNetworks(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Provider Networks</h1>
      <p className="subtitle">
        Discover available provider networks your tenant can route encounters to. Use the{' '}
        <code>networkId</code> as <code>providerNetworkTenantId</code> when creating a{' '}
        <code>provider_network</code> encounter.
      </p>

      <div className="card">
        <span className="badge">GET /provider-network/round-robin/available-networks-by-tenant</span>

        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={fetchNetworks} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Provider Networks'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </div>

      {networks !== null && (
        <div className="card">
          {networks.length === 0 ? (
            <div className="empty-state">No provider networks available for this tenant.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Network Name</th>
                  <th>Network ID (providerNetworkTenantId)</th>
                </tr>
              </thead>
              <tbody>
                {networks.map(n => (
                  <tr key={n.networkId}>
                    <td><strong>{n.networkName}</strong></td>
                    <td><code style={{ fontSize: '0.8125rem' }}>{n.networkId}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
