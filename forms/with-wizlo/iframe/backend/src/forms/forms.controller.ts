import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { FormsService } from './forms.service';

/**
 * Request body for our local attach endpoint.
 *
 * NOTE: this DTO is for OUR local NestJS backend — NOT for the Wizlo API.
 * The backend uses formId + patientId to run three internal API calls:
 *   1. GET /forms/public-link/{formId}  → hashedToken
 *   2. GET /clients/{patientId}          → patient email/name
 *   3. POST /forms/public/init-session  → sessionId
 * and then returns the final embedUrl.
 */
class AttachFormDto {
  @IsString()
  @IsUUID()
  formId: string;

  @IsString()
  @IsUUID()
  patientId: string;
}

/**
 * FormsController — two endpoints for the iframe flow.
 *
 *  GET  /forms          — list all published forms
 *  POST /forms/attach   — create an embed URL for a specific form
 *
 * The frontend calls GET /forms to show the form picker, then calls
 * POST /forms/attach when the user selects one, and finally renders the
 * returned embedUrl in an <iframe>.
 */
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  /**
   * Returns all published forms.
   */
  @Get()
  getForms() {
    return this.formsService.getForms();
  }

  /**
   * Checks whether a form is ready for M2M iframe embedding.
   * Called in parallel for every form when the list loads.
   *
   * Response: {
   *   compatible: boolean,
   *   status: 'ready' | 'needs_setup' | 'missing_phi' | 'error',
   *   message: string
   * }
   *
   * Status meanings:
   *   ready        — public invite already exists, embed works immediately
   *   needs_setup  — PHI fields present but no public invite yet; create one in the dashboard
   *   missing_phi  — form lacks phi_email / phi_first_name / phi_last_name
   */
  @Get(':id/compatible')
  checkCompatible(@Param('id') id: string) {
    return this.formsService.checkIframeCompatible(id);
  }

  /**
   * Builds a personalised iframe embed URL via a three-step M2M-compatible flow:
   *   1. GET /forms/public-link/{formId}  → hashedToken (requires existing public invite)
   *   2. GET /clients/{patientId}          → patient email/name for pre-population
   *   3. POST /forms/public/init-session  → sessionId (personalises the form session)
   *
   * Request:  { "formId": "<uuid>", "patientId": "<uuid>" }
   * Response: { "formId": "...", "embedUrl": "https://{WIZLO_APP_URL}/form-submission?token=...&sid=..." }
   *
   * The `embedUrl` is placed directly in <iframe src="...">.
   * The token is the raw bcrypt hash — Wizlo accepts it as-is in the query string.
   */
  @Post('attach')
  @HttpCode(HttpStatus.CREATED)
  attachForm(@Body() dto: AttachFormDto) {
    return this.formsService.attachForm(dto.formId, dto.patientId);
  }
}
