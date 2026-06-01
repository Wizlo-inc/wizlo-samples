import { Module } from '@nestjs/common';
import { PatientsModule } from './patients/patients.module';
import { FormsModule } from './forms/forms.module';
import { SubmissionModule } from './submission/submission.module';

/**
 * Root module — registers the three feature modules:
 *  - PatientsModule  → search / create patients via Wizlo /clients API
 *  - FormsModule     → list published forms + fetch their field schema
 *  - SubmissionModule → submit filled form data to Wizlo programmatically
 */
@Module({
  imports: [PatientsModule, FormsModule, SubmissionModule],
})
export class AppModule {}
