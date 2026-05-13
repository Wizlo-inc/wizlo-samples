import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { LifecycleController } from './lifecycle.controller';
import { LifecycleService } from './lifecycle.service';

@Module({
  imports: [WizloModule],
  controllers: [LifecycleController],
  providers: [LifecycleService],
})
export class LifecycleModule {}
