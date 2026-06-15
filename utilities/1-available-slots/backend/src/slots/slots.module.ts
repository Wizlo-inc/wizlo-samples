import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [WizloModule],
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
