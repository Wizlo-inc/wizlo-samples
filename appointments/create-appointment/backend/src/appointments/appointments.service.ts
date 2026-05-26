import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

interface AppointmentResponse {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  scheduledTimeZone: string;
  careType: string;
  patientId: string;
  providerId: string;
  clinicId: string;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly wizlo: WizloService) {}

  async createAppointment(dto: CreateAppointmentDto): Promise<AppointmentResponse> {
    return this.wizlo.request<AppointmentResponse>('/appointments', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}
