import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { TokenRequestDto } from './dto/token-request.dto';

export interface UserTokenResponse {
  accessToken: string;
  refreshToken?: string;
  /** Echoed back so the frontend can pass it to the widget's initParams.baseUrl. */
  baseUrl: string;
}

@Injectable()
export class AuthService {
  /**
   * Exchange the patient's email for a USER-scoped Wizlo token.
   *
   * This is the only server-side piece the chat widget needs: it calls
   * POST /oauth/user-token with the M2M client credentials plus the user's
   * email, and hands the resulting user token to the browser. The widget then
   * uses that token to talk to Wizlo directly.
   */
  async getUserToken(dto: TokenRequestDto): Promise<UserTokenResponse> {
    const baseUrl = process.env.WIZLO_BASE_URL;
    const clientId = process.env.WIZLO_CLIENT_ID;
    const clientSecret = process.env.WIZLO_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) {
      throw new HttpException(
        'Wizlo credentials are not configured on the server (.env)',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const res = await fetch(`${baseUrl}/oauth/user-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        user_email: dto.email,
        grant_type: 'client_credentials',
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !data.access_token) {
      throw new HttpException(
        data.error_description || data.error || 'Authentication failed',
        res.status || HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      baseUrl,
    };
  }
}
