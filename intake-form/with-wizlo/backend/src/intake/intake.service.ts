import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { SubmitIntakeDto } from './dto/submit-intake.dto';

@Injectable()
export class IntakeService {
  constructor(private readonly wizlo: WizloService) {}

  async submit(dto: SubmitIntakeDto) {
    return this.wizlo.request('/forms/programmatic/submit', {
      method: 'POST',
      body: JSON.stringify({
        formId: dto.formId,
        patientId: dto.patientId,
        structure: dto.structure,
      }),
    });
  }
}
