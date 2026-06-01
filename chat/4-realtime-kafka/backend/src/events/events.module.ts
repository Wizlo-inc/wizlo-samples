import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
  controllers: [EventsController],
  providers: [KafkaConsumerService],
})
export class EventsModule {}
