import { Module } from '@nestjs/common';
import { WizloService } from './wizlo.service';

@Module({ providers: [WizloService], exports: [WizloService] })
export class WizloModule {}
