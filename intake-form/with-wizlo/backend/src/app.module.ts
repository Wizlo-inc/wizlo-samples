import { Module } from '@nestjs/common';
import { PatientsModule } from './patients/patients.module';
import { FormsModule } from './forms/forms.module';
import { IntakeModule } from './intake/intake.module';

@Module({ imports: [PatientsModule, FormsModule, IntakeModule] })
export class AppModule {}
