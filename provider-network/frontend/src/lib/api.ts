const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080';

export interface ProviderNetwork {
  networkId: string;
  networkName: string;
}

export async function listProviderNetworks(): Promise<ProviderNetwork[]> {
  const res = await fetch(`${API_URL}/provider-networks`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
