import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

interface UpdateAppointmentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    appointmentId: string;
    status: string;
    startAt: string;
    endAt: string;
    duration: number;
    appointmentDate: string;
    careType: string;
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly wizlo: WizloService) {}

  async updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<UpdateAppointmentResponse> {
    return this.wizlo.request<UpdateAppointmentResponse>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }
}
