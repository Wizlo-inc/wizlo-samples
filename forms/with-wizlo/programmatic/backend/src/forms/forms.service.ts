import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

/**
 * FormsService — reads form metadata from the Wizlo API.
 *
 * Two operations are needed for programmatic forms:
 *  1. List published forms so the user can pick one.
 *  2. Fetch a form's field schema — this gives us a flat list of every field
 *     (with label, data type, required flag, etc.) plus a `payloadTemplate`
 *     that shows the exact JSON structure we must send when submitting.
 */
@Injectable()
export class FormsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * GET /forms?status=published
   *
   * Returns all forms in the "published" state — these are the only ones
   * that can receive submissions.
   */
  async getForms() {
    return this.wizlo.request('/forms?status=published&page=1&limit=50');
  }

  /**
   * GET /forms/:id/schema
   *
   * Returns three things the programmatic submission flow needs:
   *
   *  - `fieldSchema[]`    — flat list of every field with label, dataType, required,
   *                         isPHI, vitalTypeId, pageContext, etc.
   *                         Use this to dynamically render the form inputs.
   *
   *  - `structure`        — the complete form template (pages → rows → fields)
   *                         with empty values. Clone this and fill values before submitting.
   *
   *  - `payloadTemplate`  — a ready-to-copy JSON showing the exact submission payload.
   *                         Same shape as `structure` but formatted as a submission.
   *
   * @param formId  The UUID of the selected form
   */
  async getFormSchema(formId: string) {
    return this.wizlo.request(`/forms/${formId}/schema`);
  }
}
