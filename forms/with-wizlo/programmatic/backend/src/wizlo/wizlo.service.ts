import { Injectable, HttpException } from '@nestjs/common';

/**
 * WizloService — central HTTP client for the Wizlo API.
 *
 * Handles two things automatically:
 *  1. OAuth2 token acquisition via the client_credentials grant (M2M / machine-to-machine)
 *  2. Token caching so we re-use the same token until it expires, instead of fetching a new one on every request
 *
 * Every other service calls `this.wizlo.request(endpoint, options)` and never
 * has to think about auth.
 */
@Injectable()
export class WizloService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0; // Unix ms timestamp after which the cached token is stale

  /**
   * Fetches a fresh OAuth2 access token using the client_credentials grant,
   * or returns the cached token if it is still valid.
   *
   * The token is stored in memory — it resets on each server restart.
   * We subtract 60 s from the server-reported expiry as a safety buffer.
   */
  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

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

  /**
   * Generic Wizlo API request wrapper.
   * Automatically injects the Bearer token and re-fetches it if a 401 is returned.
   *
   * @param endpoint  Path relative to WIZLO_BASE_URL (e.g. '/clients?email=...')
   * @param options   Standard fetch RequestInit (method, body, headers, etc.)
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();

    const res = await fetch(`${process.env.WIZLO_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...((options.headers as Record<string, string>) ?? {}),
      },
    });

    if (!res.ok) {
      // If the API returns 401 the cached token is probably expired — clear it
      // so the next call will get a fresh one instead of looping forever.
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
