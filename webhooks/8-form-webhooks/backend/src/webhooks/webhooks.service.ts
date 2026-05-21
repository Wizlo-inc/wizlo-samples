import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import * as crypto from 'crypto';

interface ReceivedEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  payload: any;
}

const FORM_EVENTS = [
  'session_started', 'progress_saved', 'completed',
  'product_selected', 'coupon_used', 'disqualified', 'abandoned',
];

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
    const rawEvent: string = body.event || '';
    const eventType = rawEvent.replace('forms.', '') || 'unknown';
    const event: ReceivedEvent = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      eventType,
      payload: body,
    };
    this.events.unshift(event);
    if (this.events.length > 100) this.events.pop();
    console.log(`[Webhook] forms.${eventType} — form: ${body.data?.form_name || '?'} session: ${body.data?.session_id?.slice(0, 8) || '?'} at ${event.receivedAt}`);
    return { status: 'received', id: event.id };
  }

  getEvents() {
    return { events: this.events, total: this.events.length };
  }

  clearEvents() {
    this.events.length = 0;
    return { status: 'cleared' };
  }

  async register(url: string, event = 'session_started', secret?: string) {
    const config: any = {
      name: `Form ${event} Webhook`,
      module: 'forms',
      event,
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

  getAvailableEvents() {
    return FORM_EVENTS;
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
