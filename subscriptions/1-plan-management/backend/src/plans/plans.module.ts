import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [WizloModule],
  controllers: [PlansController],
  providers: [PlansService],
})
export class PlansModule {}
