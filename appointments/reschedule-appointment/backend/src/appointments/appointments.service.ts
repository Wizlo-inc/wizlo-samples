import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

interface RescheduleResponse {
  success: boolean;
  message: string;
  data: {
    oldAppointmentId: string;
    newAppointmentId: string;
    newAppointment: {
      id: string;
      startAt: string;
      endAt: string;
      status: string;
      rescheduledFrom: string;
    };
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly wizlo: WizloService) {}

  async rescheduleAppointment(id: string, dto: RescheduleAppointmentDto): Promise<RescheduleResponse> {
    return this.wizlo.request<RescheduleResponse>(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}
