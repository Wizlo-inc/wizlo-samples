import { Controller, Post, Param, Body } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.rescheduleAppointment(id, dto);
  }
}
