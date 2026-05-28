import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Body for POST /chats-v2/encounter-thread/patient.
 *
 * A chat thread is always tied to a single encounter. You must know the
 * encounter's GFE ID (e.g. EA00000077) before creating a thread. Wizlo
 * resolves the encounter to its order internally and returns the existing
 * thread if one already exists for the encounter (creation is idempotent per
 * encounter).
 *
 * `patientEmail` is the patient who owns the encounter. Wizlo verifies
 * `encounter.patientId === req.user.userId` on this endpoint, so we exchange
 * the M2M client credentials + this email for a user-scoped token before
 * calling Wizlo.
 */
export class CreateThreadDto {
  @IsNotEmpty()
  @IsString()
  encounterId!: string;

  @IsNotEmpty()
  @IsEmail()
  patientEmail!: string;
}
