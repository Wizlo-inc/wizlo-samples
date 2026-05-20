/**
 * Module:    Refills
 * Workflow:  2 — Create refill order
 * File:      refill-orders/refill-orders.module.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { RefillOrdersController } from './refill-orders.controller';
import { RefillOrdersService } from './refill-orders.service';

@Module({
  imports: [WizloModule],
  controllers: [RefillOrdersController],
  providers: [RefillOrdersService],
})
export class RefillOrdersModule {}
