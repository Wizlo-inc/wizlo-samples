import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.service.create(dto);
  }

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.service.checkout(dto);
  }

  @Post('mark-paid')
  markPaid(@Body() dto: MarkPaidDto) {
    return this.service.markPaid(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string, @Query() query: ListOrdersQueryDto) {
    return this.service.getOrders(id, query);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') id: string, @Query() query: ListTransactionsQueryDto) {
    return this.service.getTransactions(id, query);
  }
}
