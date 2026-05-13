import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { AutopayController } from './autopay.controller';
import { AutopayService } from './autopay.service';

@Module({
  imports: [WizloModule],
  controllers: [AutopayController],
  providers: [AutopayService],
})
export class AutopayModule {}
