import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmitFormDto } from './dto/submit-form.dto';

/**
 * SubmissionController — single endpoint that receives the filled form and submits it.
 *
 *  POST /submission/submit
 *
 * Called by the frontend after the user finishes filling all form fields.
 * The frontend sends:
 *  {
 *    "formId":    "<form-uuid>",
 *    "patientId": "<patient-uuid>",
 *    "structure": { <filled pages/rows/fields tree> },
 *    "metadata":  { ... }   // optional
 *  }
 *
 * Returns the Wizlo API response which includes submissionId, patientUpdated, vitalsRecorded.
 */
@Controller('submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitFormDto) {
    return this.submissionService.submit(dto);
  }
}
