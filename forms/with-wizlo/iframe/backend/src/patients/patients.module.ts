import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [WizloModule],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
