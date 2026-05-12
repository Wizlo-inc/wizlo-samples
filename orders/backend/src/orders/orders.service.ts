import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreateOrderDto) {
    return this.wizlo.request('/tenants/orders', {
      method: 'POST',
      body: JSON.stringify({
        clinicId: process.env.WIZLO_CLINIC_ID,
        patient_id: dto.patientId,
        items: [{ productOfferId: dto.productOfferId, qty: dto.qty ?? 1 }],
        serviceQueue: dto.serviceQueue ?? 'internal_staff',
        reviewType: dto.reviewType ?? 'asynchronous',
        source: dto.source ?? 'CLINIC',
      }),
    });
  }

  async getSubscriptionOrders(subscriptionId: string) {
    return this.wizlo.request(`/subscriptions/${subscriptionId}/orders`);
  }
}
