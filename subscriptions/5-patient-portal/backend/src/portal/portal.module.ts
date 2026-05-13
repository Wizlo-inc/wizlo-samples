import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [WizloModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
