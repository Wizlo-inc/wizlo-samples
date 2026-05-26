import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { AppointmentStatus } from './dto/update-appointment-status.dto';

interface UpdateStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    updatedAt: string;
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly wizlo: WizloService) {}

  async updateStatus(id: string, status: AppointmentStatus): Promise<UpdateStatusResponse> {
    return this.wizlo.request<UpdateStatusResponse>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}
