/**
 * Module:    Refills / Edge Cases
 * Workflow:  Reproduce REFILL_NOT_ELIGIBLE / bypassDaysOfSupply
 * File:      refill-orders/refill-orders.module.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
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
