import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(private readonly wizlo: WizloService) {}

  create(dto: CreateWebhookDto) {
    return this.wizlo.request('/tenant/webhooks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  list() {
    return this.wizlo.request('/tenant/webhooks');
  }

  getById(id: string) {
    return this.wizlo.request(`/tenant/webhooks/${id}`);
  }

  update(id: string, dto: UpdateWebhookDto) {
    return this.wizlo.request(`/tenant/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  remove(id: string) {
    return this.wizlo.request(`/tenant/webhooks/${id}`, { method: 'DELETE' });
  }
}
