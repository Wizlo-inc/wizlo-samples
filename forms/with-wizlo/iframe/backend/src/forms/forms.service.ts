import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

/**
 * FormsService — reads form metadata and creates iframe embed URLs.
 *
 * The iframe pattern has two backend calls:
 *
 *  1. GET /forms?status=published
 *     List all published forms so the user can pick one.
 *
 *  2. POST /forms/attach  { formId }
 *     Creates a user-scoped form instance in Wizlo and returns an `embedUrl`.
 *     This URL is a one-time, token-protected link that you put in an <iframe>.
 *     The user then fills and submits the form entirely inside that iframe —
 *     Wizlo handles all the UI, validation, PHI mapping, and submission storage.
 *
 * Response from /forms/attach:
 *  {
 *    formId:               "<uuid>",
 *    userFormInvitationId: "<uuid>",   // Wizlo's internal tracking ID
 *    embedUrl:             "https://app.wizlo.com/form-submission?token=..."
 *  }
 */
@Injectable()
export class FormsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * GET /forms?status=published
   * Fetch all forms ready to receive submissions.
   */
  async getForms() {
    return this.wizlo.request('/forms?status=published&page=1&limit=50');
  }

  /**
   * Check whether a form is ready for M2M iframe embedding.
   *
   * We call GET /forms/public-link/{formId} and categorise the result into
   * one of three states:
   *
   *  ✓ ready          — existing public invitation found → embed will work immediately.
   *
   *  ⚠ needs_setup   — form has the required PHI fields but no public invite yet.
   *                     An admin must open the Wizlo dashboard → Forms → Share to
   *                     generate the first public link. After that this check passes.
   *                     (Creating a new invite via M2M fails because the DB foreign key
   *                     on UserFormInvitation.sharedById requires a real user ID, not
   *                     an API client ID.)
   *
   *  ✗ missing_phi   — form is missing phi_email / phi_first_name / phi_last_name.
   *                     Add those fields in the Wizlo form builder and republish.
   */
  async checkIframeCompatible(formId: string): Promise<{
    compatible: boolean;
    status: 'ready' | 'needs_setup' | 'missing_phi' | 'error';
    message: string;
  }> {
    try {
      await this.wizlo.request(`/forms/public-link/${formId}`);
      // Success → existing public invite returned, token is available
      return {
        compatible: true,
        status: 'ready',
        message: 'Public embed link exists — ready to embed.',
      };
    } catch (err: unknown) {
      const body =
        (err as { response?: string | Record<string, unknown> })?.response ?? err;
      const msg =
        typeof body === 'string'
          ? body
          : JSON.stringify(body ?? '');

      if (msg.toLowerCase().includes('missing required fields')) {
        return {
          compatible: false,
          status: 'missing_phi',
          message:
            'Form is missing phi_email, phi_first_name, or phi_last_name fields. ' +
            'Add them in the Wizlo form builder and republish.',
        };
      }

      // FK / "Failed to share" → PHI fields present but no public invite yet
      return {
        compatible: false,
        status: 'needs_setup',
        message:
          'Form has the required fields but no public embed link yet. ' +
          'Go to Wizlo dashboard → Forms → [this form] → Share → Get Public Link. ' +
          'Once created, this form will show ✓ ready.',
      };
    }
  }

  /**
   * Build a personalised iframe embed URL for a form — works with M2M tokens.
   *
   * WHY NOT POST /forms/attach:
   *   That endpoint requires a real user JWT with userId (not M2M) because it
   *   creates a patient-specific invitation tied to a logged-in user's account.
   *
   * THREE-STEP M2M-COMPATIBLE FLOW:
   *
   *   Step 1 — GET /forms/public-link/{formId}  (M2M ✓)
   *     Returns a hashedToken for the form's public invite.
   *     ⚠ Wizlo requires the form to have phi_email, phi_first_name, phi_last_name
   *       fields. If these are missing this call throws 400 "Missing required fields".
   *       Those fields are needed so Wizlo can identify the patient on submission.
   *
   *   Step 2 — GET /clients/{patientId}  (M2M ✓)
   *     Fetches the patient's email + name so the form can be pre-filled.
   *
   *   Step 3 — POST /forms/public/init-session  (public, no auth needed)
   *     Creates a pre-filled session for this patient on this form.
   *     Returns a sessionId that locks the form to this patient's data.
   *
   *   Final embed URL:
   *     {WIZLO_APP_URL}/form-submission?token={encodedToken}&sid={sessionId}
   *
   * @param formId    UUID of the published form
   * @param patientId UUID of the patient — used to pre-fill the form
   */
  async attachForm(
    formId: string,
    patientId: string,
  ): Promise<{ formId: string; embedUrl: string }> {
    const appUrl = (process.env.WIZLO_APP_URL ?? '').replace(/\/$/, '');
    if (!appUrl) {
      throw new Error(
        'WIZLO_APP_URL is not set. Add it to .env — it is the Wizlo frontend base URL ' +
        '(e.g. https://app-uat.wizlo.com), not the API URL.',
      );
    }

    // ── Step 1: Get the public form token ────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLink = await this.wizlo.request<any>(`/forms/public-link/${formId}`);
    // Wizlo may wrap the response in { data: { hashedToken } } or return it flat
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkData: any = rawLink?.data ?? rawLink;
    const hashedToken: string = linkData.hashedToken ?? linkData.token ?? linkData.hash;
    if (!hashedToken) {
      throw new Error(
        `GET /forms/public-link/${formId} did not return a token. ` +
        `Response: ${JSON.stringify(rawLink)}`,
      );
    }

    // ── Step 2: Fetch patient details for session pre-population ─────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPatient = await this.wizlo.request<any>(`/clients/${patientId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patient: any = rawPatient?.data ?? rawPatient;

    // ── Step 3: Initialise a personalised session (best-effort) ──────────────
    // If init-session fails for any reason we fall back to a tokenOnly URL —
    // the form will still load but won't be pre-filled with patient data.
    let sessionId: string | null = null;
    try {
      const sessionData = await this.wizlo.request<{ sessionId: string }>(
        '/forms/public/init-session',
        {
          method: 'POST',
          body: JSON.stringify({
            token: hashedToken,
            patient: {
              email: patient.email ?? patient.emailAddress,
              firstName: patient.firstName ?? patient.first_name,
              lastName: patient.lastName ?? patient.last_name,
              ...(patient.dateOfBirth && { dateOfBirth: patient.dateOfBirth }),
              ...(patient.phone && { phone: patient.phone }),
            },
          }),
        },
      );
      sessionId = sessionData?.sessionId ?? null;
    } catch {
      // init-session is not critical — proceed without patient pre-fill
    }

    // ── Final: Embed URL ──────────────────────────────────────────────────────
    // Wizlo expects the raw bcrypt hash in the query string, not URL-encoded.
    const embedUrl = sessionId
      ? `${appUrl}/form-submission?token=${hashedToken}&sid=${sessionId}`
      : `${appUrl}/form-submission?token=${hashedToken}`;

    return { formId, embedUrl };
  }
}
