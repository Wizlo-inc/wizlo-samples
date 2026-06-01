import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Body for POST /chats-v2/:encounterId/messages/patient.
 *
 * The Wizlo endpoint is patient-scoped — it derives the sender from the JWT's
 * `sub`, and verifies that user owns the encounter. We therefore need a
 * user-scoped token, which is minted from `patientEmail` via
 * `POST /oauth/user-token` inside `WizloService.requestAsUser()`.
 *
 * `message` is the only field forwarded to Wizlo.
 */
export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsNotEmpty()
  @IsEmail()
  patientEmail!: string;
}
