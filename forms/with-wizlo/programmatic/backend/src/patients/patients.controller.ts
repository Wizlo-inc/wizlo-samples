import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/create-patient.dto';

/**
 * PatientsController — exposes patient CRUD to the local frontend.
 *
 * The frontend never calls the Wizlo API directly; it calls this backend which
 * handles authentication and forwards the request.
 *
 *  GET  /patients?email=  — search by email (exact match)
 *  POST /patients         — create a new patient
 *  PUT  /patients/:id     — update existing patient fields
 */
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Query('email') email?: string) {
    return this.patientsService.findAll(email);
  }

  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }
}
