import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';

@Module({
  imports: [WizloModule],
  controllers: [IntakeController],
  providers: [IntakeService],
})
export class IntakeModule {}
