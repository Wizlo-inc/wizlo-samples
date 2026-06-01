import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { SubmitFormDto } from './dto/submit-form.dto';

/**
 * SubmissionService — sends the filled form to Wizlo's programmatic submission endpoint.
 *
 * POST /forms/programmatic/submit is the core of the "programmatic forms" pattern:
 *  - Your app provides the UI (the user fills in fields in YOUR interface)
 *  - Your backend collects the data and sends it to Wizlo
 *  - Wizlo processes it: maps PHI fields back to the patient profile,
 *    records any health vitals, creates a formal submission record, and fires webhooks
 *
 * The response tells you:
 *  - submissionId        — UUID of the created submission (for your records)
 *  - userFormInvitationId — the internal invitation that was fulfilled
 *  - patientUpdated      — true if any PHI fields (name, DOB, address…) were saved back to the patient
 *  - vitalsRecorded      — true if any vitals fields (BP, weight, height…) were saved
 */
@Injectable()
export class SubmissionService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Forwards the filled form structure to Wizlo.
   *
   * @param dto  Contains formId, patientId, structure (filled form JSON), and optional metadata
   */
  async submit(dto: SubmitFormDto) {
    return this.wizlo.request('/forms/programmatic/submit', {
      method: 'POST',
      body: JSON.stringify({
        formId: dto.formId,
        patientId: dto.patientId,
        structure: dto.structure,
        ...(dto.metadata && { metadata: dto.metadata }),
      }),
    });
  }
}
