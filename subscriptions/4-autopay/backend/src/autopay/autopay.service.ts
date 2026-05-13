import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { UpdateAutopayDto } from './dto/update-autopay.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class AutopayService {
  constructor(private readonly wizlo: WizloService) {}

  async getAutopay(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/autopay`);
  }

  async updateAutopay(id: string, dto: UpdateAutopayDto) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/autopay`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async updatePaymentMethod(id: string, dto: UpdatePaymentMethodDto) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/autopay/payment-method`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async retryPayment(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/retry-payment`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async resendPaymentLink(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/resend-payment-link`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}
