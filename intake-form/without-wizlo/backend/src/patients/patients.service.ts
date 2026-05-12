import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientDto, UpdatePatientDto } from './dto/create-patient.dto';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PatientsService {
  private store = new Map<string, Patient>();

  findAll(email?: string): Patient[] {
    const all = Array.from(this.store.values());
    if (email) return all.filter(p => p.email.toLowerCase() === email.toLowerCase());
    return all;
  }

  create(dto: CreatePatientDto): Patient {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const patient: Patient = { id, ...dto, createdAt: now, updatedAt: now };
    this.store.set(id, patient);
    return patient;
  }

  update(id: string, dto: UpdatePatientDto): Patient {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundException(`Patient ${id} not found`);
    const updated: Patient = { ...existing, ...dto, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}
