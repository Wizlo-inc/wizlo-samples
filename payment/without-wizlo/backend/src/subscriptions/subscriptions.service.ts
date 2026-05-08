import { Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  private store = new Map<string, Record<string, unknown>>();

  create(dto: CreateSubscriptionDto) {
    const id = crypto.randomUUID();
    const record = { id, createdAt: new Date().toISOString(), status: 'active', ...dto };
    this.store.set(id, record);
    return record;
  }

  findAll() {
    return Array.from(this.store.values());
  }
}
