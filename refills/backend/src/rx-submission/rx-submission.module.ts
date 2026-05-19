/**
 * Module:    Refills
 * Workflow:  3 — Rx submission
 * File:      rx-submission/rx-submission.module.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-18
 */
import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { RxSubmissionController } from './rx-submission.controller';
import { RxSubmissionService } from './rx-submission.service';

@Module({
  imports: [WizloModule],
  controllers: [RxSubmissionController],
  providers: [RxSubmissionService],
})
export class RxSubmissionModule {}
