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
        clinicId: process.env.WIZLO_CLINIC_ID || '1d836ade-bb7e-47a5-9f4a-d2c45ad8dad6',
        patient_id: dto.patientId,
        items: [{ productOfferId: dto.productOfferId, qty: dto.qty ?? 1 }],
        serviceQueue: 'internal_staff',
        reviewType: 'asynchronous',
        source: 'CLINIC',
      }),
    });
  }

  async getSubscriptionOrders(subscriptionId: string) {
    return this.wizlo.request(`/subscriptions/${subscriptionId}/orders`);
  }
}
