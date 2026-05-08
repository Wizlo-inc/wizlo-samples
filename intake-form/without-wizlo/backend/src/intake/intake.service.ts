import { Injectable } from '@nestjs/common';
import { SubmitIntakeDto } from './dto/submit-intake.dto';

@Injectable()
export class IntakeService {
  private store = new Map<string, Record<string, unknown>>();

  submit(dto: SubmitIntakeDto) {
    const id = crypto.randomUUID();
    const record = { id, createdAt: new Date().toISOString(), ...dto };
    this.store.set(id, record);
    return record;
  }

  findAll() {
    return Array.from(this.store.values());
  }
}
