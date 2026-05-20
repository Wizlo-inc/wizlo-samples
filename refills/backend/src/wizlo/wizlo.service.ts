/**
 * Module:    Refills
 * Workflow:  Shared OAuth + HTTP helper
 * File:      wizlo/wizlo.service.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 *
 * Singleton WizloService: fetches a client_credentials token on first request,
 * caches it in memory, and attaches it as a bearer token to every subsequent
 * call. Mirrors the same helper used in encounters/ and orders/.
 */
import { Injectable, HttpException } from '@nestjs/common';

@Injectable()
export class WizloService {
  private accessToken: string | null = null;

  private async getToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
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
    const data = (await res.json()) as { access_token: string };
    this.accessToken = data.access_token;
    return this.accessToken!;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${process.env.WIZLO_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...((options.headers as Record<string, string>) || {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new HttpException(err, res.status);
    }
    return res.json() as Promise<T>;
  }
}
