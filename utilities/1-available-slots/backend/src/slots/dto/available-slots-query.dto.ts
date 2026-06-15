import { IsIn, IsEmail, IsString, IsNotEmpty, IsOptional, Matches, ValidateIf } from 'class-validator';

/**
 * Unified query for the available-slots utility.
 *
 * `type` selects which underlying Wizlo endpoint is called:
 *  - `provider` → telehealth slots for an existing encounter (used before a SYNC encounter is scheduled)
 *  - `lab`      → PSC walk-in lab slots near a ZIP (used during subscription enrollment, lab variants)
 *
 * Both flavours are patient-scoped, so `patientEmail` is always required — the
 * backend mints a user-scoped token from it (see WizloService.requestAsUser).
 */
export class AvailableSlotsQueryDto {
  @IsIn(['provider', 'lab'])
  type: 'provider' | 'lab';

  @IsEmail()
  patientEmail: string;

  // ── type=provider ────────────────────────────────────────────────────
  // GET /appointments/encounter/:encounterId/available-slots?date=YYYY-MM-DD
  @ValidateIf((o) => o.type === 'provider')
  @IsString()
  @IsNotEmpty()
  encounterId?: string;

  @ValidateIf((o) => o.type === 'provider')
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  // ── type=lab ─────────────────────────────────────────────────────────
  // GET /tenants/patient-subscriptions/psc-locations?zipCode=&lab=&radius=&startDate=
  @ValidateIf((o) => o.type === 'lab')
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}(-\d{4})?$/, { message: 'Invalid ZIP code format' })
  zipCode?: string;

  @ValidateIf((o) => o.type === 'lab')
  @IsOptional()
  @IsIn(['quest', 'labcorp'])
  lab?: 'quest' | 'labcorp';

  @ValidateIf((o) => o.type === 'lab')
  @IsOptional()
  @IsIn(['10', '20', '25', '50', '100'])
  radius?: '10' | '20' | '25' | '50' | '100';

  @ValidateIf((o) => o.type === 'lab')
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate?: string;
}
