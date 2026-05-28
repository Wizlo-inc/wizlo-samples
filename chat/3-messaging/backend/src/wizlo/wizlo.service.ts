import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';

/**
 * Thin wrapper around the Wizlo REST API.
 *
 * Two flavours of token are exposed:
 *
 * - `request<T>()` — uses a cached **M2M access token** from
 *   `POST /oauth/token` (grant `client_credentials`). Good for tenant-scoped
 *   endpoints that do not need a specific user identity.
 *
 * - `requestAsUser<T>(userEmail, ...)` — fetches a **user-scoped token** from
 *   `POST /oauth/user-token` (grant `client_credentials` + `user_email`). The
 *   resulting JWT's `sub` is the resolved user's id, so user-scoped endpoints
 *   like `GET /chats-v2/:encounterId/messages` and
 *   `POST /chats-v2/:encounterId/messages/patient` pass the encounter
 *   ownership check (`encounter.patientId === req.user.userId`).
 *
 * Network errors are wrapped as 502 so NestJS never returns a generic 500.
 */
@Injectable()
export class WizloService {
  private readonly logger = new Logger(WizloService.name);
  private accessToken: string | null = null;

  // --- M2M token (cached) -----------------------------------------------

  private async fetchToken(): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${process.env.WIZLO_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: process.env.WIZLO_CLIENT_ID,
          client_secret: process.env.WIZLO_CLIENT_SECRET,
        }),
      });
    } catch (err) {
      this.logger.error('OAuth token fetch failed (network error)', err);
      throw new HttpException('Cannot reach Wizlo API', HttpStatus.BAD_GATEWAY);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`OAuth token failed: ${res.status} ${body}`);
      let parsed: string | Record<string, any>;
      try { parsed = JSON.parse(body); } catch { parsed = { message: body || 'Auth failed' }; }
      throw new HttpException(parsed, res.status);
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async getToken(): Promise<string> {
    if (!this.accessToken) {
      this.accessToken = await this.fetchToken();
    }
    return this.accessToken;
  }

  // --- User-scoped token (per-call, not cached) -------------------------

  private async fetchUserToken(userEmail: string): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${process.env.WIZLO_BASE_URL}/oauth/user-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: process.env.WIZLO_CLIENT_ID,
          client_secret: process.env.WIZLO_CLIENT_SECRET,
          user_email: userEmail,
        }),
      });
    } catch (err) {
      this.logger.error('OAuth user-token fetch failed (network error)', err);
      throw new HttpException('Cannot reach Wizlo API', HttpStatus.BAD_GATEWAY);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`OAuth user-token failed: ${res.status} ${body}`);
      let parsed: string | Record<string, any>;
      try { parsed = JSON.parse(body); } catch { parsed = { message: body || 'Auth failed' }; }
      throw new HttpException(parsed, res.status);
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  // --- Shared helpers ---------------------------------------------------

  private buildHeaders(token: string, extra?: Record<string, string>) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(extra ?? {}),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const doFetch = async (token: string): Promise<Response> => {
      try {
        return await fetch(`${process.env.WIZLO_BASE_URL}${endpoint}`, {
          ...options,
          headers: this.buildHeaders(token, options.headers as Record<string, string>),
        });
      } catch (err) {
        this.logger.error(`Request to ${endpoint} failed (network error)`, err);
        throw new HttpException('Cannot reach Wizlo API', HttpStatus.BAD_GATEWAY);
      }
    };

    let token = await this.getToken();
    let res = await doFetch(token);

    // On 401, the cached token may have expired — refresh once and retry.
    if (res.status === 401) {
      this.logger.warn(`401 on ${endpoint} — refreshing token and retrying`);
      this.accessToken = null;
      token = await this.getToken();
      res = await doFetch(token);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Wizlo API error ${res.status} for ${endpoint}: ${body}`);
      let parsed: string | Record<string, any>;
      try { parsed = JSON.parse(body); } catch { parsed = { message: body || 'Request failed' }; }
      throw new HttpException(parsed, res.status);
    }

    return res.json() as Promise<T>;
  }

  async requestAsUser<T>(
    userEmail: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.fetchUserToken(userEmail);

    let res: Response;
    try {
      res = await fetch(`${process.env.WIZLO_BASE_URL}${endpoint}`, {
        ...options,
        headers: this.buildHeaders(token, options.headers as Record<string, string>),
      });
    } catch (err) {
      this.logger.error(`Request to ${endpoint} failed (network error)`, err);
      throw new HttpException('Cannot reach Wizlo API', HttpStatus.BAD_GATEWAY);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Wizlo API error ${res.status} for ${endpoint}: ${body}`);
      let parsed: string | Record<string, any>;
      try { parsed = JSON.parse(body); } catch { parsed = { message: body || 'Request failed' }; }
      throw new HttpException(parsed, res.status);
    }

    return res.json() as Promise<T>;
  }
}
