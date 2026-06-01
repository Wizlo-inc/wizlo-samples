import { Controller, Get, Delete } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';

@Controller('events')
export class EventsController {
  constructor(private readonly consumer: KafkaConsumerService) {}

  /** Connection status + the most recent chat-message events received. */
  @Get()
  list() {
    return this.consumer.getEvents();
  }

  @Delete()
  clear() {
    return this.consumer.clearEvents();
  }
}
