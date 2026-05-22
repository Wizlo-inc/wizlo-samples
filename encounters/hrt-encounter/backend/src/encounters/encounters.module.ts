import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';

@Module({
  imports: [WizloModule],
  controllers: [EncountersController],
  providers: [EncountersService],
})
export class EncountersModule {}
