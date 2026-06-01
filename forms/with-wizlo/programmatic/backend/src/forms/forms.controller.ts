import { Controller, Get, Param } from '@nestjs/common';
import { FormsService } from './forms.service';

/**
 * FormsController — exposes form listing and schema endpoints to the frontend.
 *
 *  GET /forms              — list all published forms
 *  GET /forms/:id/schema   — field schema + payload template for one form
 */
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  /**
   * Returns all published forms.
   * The frontend uses this to let the user pick which form to fill out.
   */
  @Get()
  getForms() {
    return this.formsService.getForms();
  }

  /**
   * Returns the field schema for a specific form.
   *
   * The frontend uses the `fieldSchema` array to dynamically render inputs
   * (one input per field), and uses `payloadTemplate` as the base structure
   * for building the submission payload.
   */
  @Get(':id/schema')
  getFormSchema(@Param('id') id: string) {
    return this.formsService.getFormSchema(id);
  }
}
