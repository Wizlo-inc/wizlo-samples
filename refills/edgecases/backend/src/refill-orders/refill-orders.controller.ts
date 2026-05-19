/**
 * Module:    Refills / Edge Cases
 * Workflow:  Reproduce REFILL_NOT_ELIGIBLE / bypassDaysOfSupply
 * File:      refill-orders/refill-orders.controller.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
 */
import { Body, Controller, Post } from '@nestjs/common';
import { RefillOrdersService } from './refill-orders.service';
import { CreateRefillDto } from './dto/create-refill.dto';

@Controller('refill-orders')
export class RefillOrdersController {
  constructor(private readonly refillOrders: RefillOrdersService) {}

  @Post()
  create(@Body() dto: CreateRefillDto) {
    return this.refillOrders.create(dto);
  }
}
