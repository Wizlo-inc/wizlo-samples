import { Injectable, UnauthorizedException } from '@nestjs/common';
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
        throw new UnauthorizedException('invalid_signature');
      }
    }
    const event: ReceivedEvent = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      eventType: body.eventType || body.event || 'unknown',
      payload: body,
    };
    this.events.unshift(event);
    if (this.events.length > 100) this.events.pop();
    console.log(`[Webhook] encounters.updated — status: ${body.encounter?.encounter_status || '?'} at ${event.receivedAt}`);
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
      name: 'Encounter Status Webhook',
      module: 'encounters',
      event: 'updated',
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
      const rawSig = signature.includes('=') ? signature.split('=').slice(1).join('=') : signature;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expected = hmac.digest('hex');
      const sigBuffer = Buffer.from(rawSig, 'hex');
      const expectedBuffer = Buffer.from(expected, 'hex');
      if (sigBuffer.length !== expectedBuffer.length) return false;
      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }
}
