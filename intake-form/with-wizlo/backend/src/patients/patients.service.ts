import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreatePatientDto) {
    return this.wizlo.request('/clients', {
      method: 'POST',
      body: JSON.stringify({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      }),
    });
  }
}
