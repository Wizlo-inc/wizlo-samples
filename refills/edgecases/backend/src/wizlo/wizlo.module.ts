/**
 * Module:    Refills / Edge Cases
 * Workflow:  Shared OAuth + HTTP helper
 * File:      wizlo/wizlo.module.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-19
 */
import { Module } from '@nestjs/common';
import { WizloService } from './wizlo.service';

@Module({ providers: [WizloService], exports: [WizloService] })
export class WizloModule {}
