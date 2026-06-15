import { Injectable, HttpException } from '@nestjs/common';

/**
 * Thin wrapper around the Wizlo REST API using a cached **M2M access token**
 * from `POST /oauth/token` (grant `client_credentials`). The upload-from-url
 * endpoint (`POST /clients-documents/:id/upload-url/:documentType`) requires an
 * admin token.
 */
@Injectable()
export class WizloService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;
    const res = await fetch(`${process.env.WIZLO_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.WIZLO_CLIENT_ID,
        client_secret: process.env.WIZLO_CLIENT_SECRET,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Auth failed' }));
      throw new HttpException(err, res.status);
    }
    const data = await res.json() as { access_token: string; expires_in?: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;
    return this.accessToken!;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${process.env.WIZLO_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...((options.headers as Record<string, string>) || {}),
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
      }
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new HttpException(err, res.status);
    }
    return res.json() as Promise<T>;
  }
}
