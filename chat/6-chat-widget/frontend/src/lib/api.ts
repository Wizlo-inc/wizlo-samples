const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3065';

export interface UserTokenResponse {
  accessToken: string;
  refreshToken?: string;
  baseUrl: string;
}

/**
 * Ask our backend for a USER-scoped Wizlo token. The backend holds the
 * client_id / client_secret; we only ever send the patient's email.
 */
export async function getUserToken(email: string): Promise<UserTokenResponse> {
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || JSON.stringify(json));
  return json;
}
