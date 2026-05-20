/**
 * Module:    Refills
 * Workflow:  2 — Create refill order
 * File:      refill-orders/refill-orders.controller.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RefillOrdersService } from './refill-orders.service';
import { CreateRefillDto } from './dto/create-refill.dto';

@Controller('refill-orders')
export class RefillOrdersController {
  constructor(private readonly refillOrders: RefillOrdersService) {}

  @Post()
  create(@Body() dto: CreateRefillDto) {
    return this.refillOrders.create(dto);
  }

  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.refillOrders.getOrder(orderId);
  }
}
