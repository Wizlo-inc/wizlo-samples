import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import * as crypto from 'crypto';

interface ReceivedEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  payload: any;
}

@Injectable()
export class WebhooksService {
  private readonly events: ReceivedEvent[] = [];

  constructor(private readonly wizlo: WizloService) {}

  handleEvent(body: any, headers: Record<string, string>) {
    const secret = process.env.WEBHOOK_SECRET;
    const sigHeader = (process.env.WEBHOOK_SIGNING_HEADER || 'x-webhook-signature').toLowerCase();
    if (secret && headers[sigHeader]) {
      if (!this.verifySignature(JSON.stringify(body), headers[sigHeader], secret)) {
        console.warn('[Webhook] Invalid signature — rejecting event');
        return { status: 'invalid_signature' };
      }
    }
    const event: ReceivedEvent = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      eventType: body.event_type || 'RX_RECEIVED',
      payload: body,
    };
    this.events.unshift(event);
    if (this.events.length > 100) this.events.pop();
    const medReqs = body.medication_requests || [];
    const drugs = medReqs.map((m: any) => m.drug_name).slice(0, 2).join(', ');
    console.log(`[Webhook] rx.honeybee_received — patient: ${body.patient_id || '?'} drugs: ${drugs} at ${event.receivedAt}`);
    return { status: 'received', id: event.id };
  }

  getEvents() {
    return { events: this.events, total: this.events.length };
  }

  clearEvents() {
    this.events.length = 0;
    return { status: 'cleared' };
  }

  async register(url: string, secret?: string) {
    const config: any = {
      name: 'Honeybee Raw Data Webhook',
      module: 'rx',
      event: 'honeybee_received',
      url,
      maxRetries: 3,
    };
    if (secret) {
      config.isSigningRequired = true;
      config.signingConfig = { secret, algorithm: 'hmac-sha256', headerKey: 'X-Webhook-Signature' };
    }
    return this.wizlo.request('/tenant/webhooks', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  private verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expected = hmac.digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }
}
