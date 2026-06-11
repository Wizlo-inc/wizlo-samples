import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [WizloModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
