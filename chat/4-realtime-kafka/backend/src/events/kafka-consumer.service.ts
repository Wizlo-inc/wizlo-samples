import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Consumer, Kafka, logLevel } from 'kafkajs';

/**
 * A single chat-message event as delivered on the tenant's Kafka topic.
 * `headers` and the parsed message `value` are flattened together for display.
 */
export interface ReceivedChatEvent {
  receivedAt: string;
  messageType: string; // from the x-message-type header
  tenantId: string; // from the x-tenant-id header
  key: string | null; // thread ID or encounter ID
  offset: string;
  payload: {
    messageId?: string;
    content?: string;
    sender?: { displayName?: string; isPatient?: boolean; avatarUrl?: string | null };
    sentAt?: string;
    deliveryStatus?: string;
    attachments?: string[];
    [k: string]: unknown;
  };
}

/**
 * Long-running Kafka consumer.
 *
 * Connects to the tenant's topic over TLS + SASL/PLAIN, consumes `chat-message`
 * events published whenever a provider replies in the Wizlo portal, and keeps
 * the most recent events in memory for the demo UI to read.
 *
 * In a real integration you would push each event onward (WebSocket / SSE /
 * DB write) instead of buffering it.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('KafkaConsumer');
  private consumer: Consumer | null = null;
  private connected = false;
  private readonly events: ReceivedChatEvent[] = [];
  private static readonly MAX_EVENTS = 100;

  async onModuleInit() {
    const brokers = process.env.KAFKA_BOOTSTRAP_SERVERS;
    const topic = process.env.KAFKA_TOPIC;
    const groupId = process.env.KAFKA_CONSUMER_GROUP;
    const username = process.env.KAFKA_SASL_USERNAME;
    const password = process.env.KAFKA_SASL_PASSWORD;

    if (!brokers || !topic || !groupId || !password) {
      this.logger.warn(
        'Kafka is not configured — set KAFKA_* in your .env to start consuming. ' +
          'The HTTP API still works and will return an empty event list.',
      );
      return;
    }

    const kafka = new Kafka({
      clientId: 'wizlo-chat-sample-consumer',
      brokers: [brokers],
      ssl: true, // TLS is required
      sasl: {
        mechanism: 'plain',
        username: username || '$ConnectionString',
        password,
      },
      logLevel: logLevel.ERROR,
    });

    this.consumer = kafka.consumer({ groupId });

    try {
      await this.consumer.connect();
      // fromBeginning: false → only consume messages sent after we connect
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.connected = true;
      this.logger.log(`Connected. Listening on topic "${topic}" as "${groupId}".`);

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const header = (key: string) => message.headers?.[key]?.toString() ?? '';
          const messageType = header('x-message-type');

          // Route by header; ignore message types we do not understand.
          if (messageType && messageType !== 'chat-message') {
            this.logger.debug(`Ignoring message type "${messageType}"`);
            return;
          }

          let payload: ReceivedChatEvent['payload'] = {};
          try {
            payload = JSON.parse(message.value?.toString() || '{}');
          } catch {
            this.logger.warn('Skipping message with non-JSON value');
            return;
          }

          const event: ReceivedChatEvent = {
            receivedAt: new Date().toISOString(),
            messageType: messageType || 'chat-message',
            tenantId: header('x-tenant-id'),
            key: message.key?.toString() ?? null,
            offset: message.offset,
            payload,
          };
          this.events.unshift(event);
          if (this.events.length > KafkaConsumerService.MAX_EVENTS) this.events.pop();
          this.logger.log(
            `chat-message from ${payload.sender?.displayName || '?'}: ${payload.content || ''}`,
          );
        },
      });
    } catch (err) {
      this.logger.error(`Failed to start consumer: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.consumer && this.connected) {
      // Graceful shutdown commits offsets cleanly so we resume where we left off.
      await this.consumer.disconnect().catch(() => undefined);
    }
  }

  getStatus() {
    return {
      connected: this.connected,
      topic: process.env.KAFKA_TOPIC || null,
      consumerGroup: process.env.KAFKA_CONSUMER_GROUP || null,
    };
  }

  getEvents() {
    return { ...this.getStatus(), events: this.events, total: this.events.length };
  }

  clearEvents() {
    this.events.length = 0;
    return { status: 'cleared' };
  }
}
