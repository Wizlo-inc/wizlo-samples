import { Controller, Get, Param } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  getForms() {
    return this.formsService.getForms();
  }

  @Get(':formId/schema')
  getFormSchema(@Param('formId') formId: string) {
    return this.formsService.getFormSchema(formId);
  }
}
