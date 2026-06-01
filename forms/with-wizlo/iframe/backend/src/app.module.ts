import { Module } from '@nestjs/common';
import { PatientsModule } from './patients/patients.module';
import { FormsModule } from './forms/forms.module';

/**
 * Root module — registers two feature modules:
 *  - PatientsModule → search / create patients via Wizlo /clients API
 *  - FormsModule    → list published forms + call POST /forms/attach to get the embed URL
 *
 * Unlike the programmatic sample there is no SubmissionModule here because
 * the user submits the form inside the Wizlo iframe — the submission happens
 * on Wizlo's side, not in your code.
 */
@Module({
  imports: [PatientsModule, FormsModule],
})
export class AppModule {}
