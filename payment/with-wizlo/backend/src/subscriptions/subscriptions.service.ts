import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreateSubscriptionDto) {
    return this.wizlo.request(`/patients/${dto.patientId}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify({ planType: dto.planType }),
    });
  }

  async findByPatient(patientId: string) {
    return this.wizlo.request(`/patients/${patientId}/subscriptions`);
  }
}
