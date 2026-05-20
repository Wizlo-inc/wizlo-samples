/**
 * Module:    Refills
 * Workflow:  3 — Rx submission
 * File:      rx-submission/rx-submission.controller.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RxSubmissionService } from './rx-submission.service';

@Controller('rx-submission')
export class RxSubmissionController {
  constructor(private readonly rxSubmission: RxSubmissionService) {}

  @Post('mark-paid')
  markPaid(@Body() body: { orderIds: string[] }) {
    return this.rxSubmission.markOrdersPaid(body.orderIds);
  }

  @Post('submit/:orderId')
  submit(@Param('orderId') orderId: string) {
    return this.rxSubmission.submitRefillRx(orderId);
  }
}
