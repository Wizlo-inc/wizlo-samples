import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { VouchedVerificationService } from './vouched-verification.service';
import { FormsPublicController } from './forms-public.controller';

@Module({
  imports: [WizloModule],
  controllers: [FormsPublicController],
  providers: [VouchedVerificationService],
})
export class VouchedModule {}
