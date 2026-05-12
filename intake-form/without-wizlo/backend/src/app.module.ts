import { Module } from '@nestjs/common';
import { IntakeModule } from './intake/intake.module';
import { PatientsModule } from './patients/patients.module';
import { FormsModule } from './forms/forms.module';

@Module({ imports: [IntakeModule, PatientsModule, FormsModule] })
export class AppModule {}
