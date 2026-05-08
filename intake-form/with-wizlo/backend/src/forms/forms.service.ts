import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

@Injectable()
export class FormsService {
  constructor(private readonly wizlo: WizloService) {}

  async getForms() {
    return this.wizlo.request('/forms?status=published&page=1&limit=50');
  }

  async getFormSchema(formId: string) {
    return this.wizlo.request(`/forms/${formId}/schema`);
  }
}
