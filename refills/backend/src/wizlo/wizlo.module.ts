/**
 * Module:    Refills
 * Workflow:  Shared OAuth + HTTP helper
 * File:      wizlo/wizlo.module.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-18
 */
import { Module } from '@nestjs/common';
import { WizloService } from './wizlo.service';

@Module({ providers: [WizloService], exports: [WizloService] })
export class WizloModule {}
