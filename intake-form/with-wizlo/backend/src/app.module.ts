import { Module } from '@nestjs/common';
import { PatientsModule } from './patients/patients.module';
import { FormsModule } from './forms/forms.module';
import { IntakeModule } from './intake/intake.module';
import { VouchedModule } from './vouched/vouched.module';

@Module({ imports: [PatientsModule, FormsModule, IntakeModule, VouchedModule] })
export class AppModule {}
