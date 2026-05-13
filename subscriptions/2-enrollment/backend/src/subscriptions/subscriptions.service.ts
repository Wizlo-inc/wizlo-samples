import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreateSubscriptionDto) {
    return this.wizlo.request('/tenants/client-subscriptions', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async checkout(dto: CheckoutDto) {
    return this.wizlo.request('/tenants/client-subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async markPaid(dto: MarkPaidDto) {
    return this.wizlo.request('/tenants/client-subscriptions/mark-paid', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getById(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}`);
  }

  async getOrders(id: string, query: ListOrdersQueryDto) {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/orders${qs ? `?${qs}` : ''}`);
  }

  async getTransactions(id: string, query: ListTransactionsQueryDto) {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/transactions${qs ? `?${qs}` : ''}`);
  }
}
