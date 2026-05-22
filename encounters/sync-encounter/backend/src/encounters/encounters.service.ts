import { Injectable, BadRequestException } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';

@Injectable()
export class EncountersService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreateEncounterDto) {
    const defaultDay = new Date();
    defaultDay.setDate(defaultDay.getDate() + 7);
    const scheduledDay = dto.scheduledDay || defaultDay.toISOString().split('T')[0];
    const scheduledTime = dto.scheduledTime || '09:00:00';

    const clinicId = process.env.WIZLO_CLINIC_ID;
    const reviewerId = process.env.WIZLO_REVIEWER_ID;
    const pharmacyId = process.env.WIZLO_PHARMACY_ID;
    const providerNetworkTenantId =
      dto.providerNetworkTenantId || process.env.WIZLO_PROVIDER_NETWORK_TENANT_ID;

    // Fields shared across all scenarios
    const base = {
      clinicId,
      patientId: dto.patientId,
      pharmacyId,
      treatmentIds: dto.treatmentIds || [],
      additionalNotes: dto.additionalNotes || '',
      documentIds: [],
      source: 'FORMS',
      isCommissionWaived: false,
      allowUnassignedOnFailure: true,
    };

    let scenarioFields: Record<string, unknown>;

    switch (dto.scenario) {
      // ── 1. Standard synchronous ────────────────────────────────────────────
      // Reviewer is assigned, appointment booked immediately.
      case 'standard-sync':
        scenarioFields = {
          reviewType: 'synchronous',
          serviceQueue: 'internal_staff',
          reviewerId,
          formIds: [],
          scheduledDay,
          scheduledTime,
          scheduledTimeZone: 'America/Los_Angeles',
          slotDurationMinutes: 30,
          skipOrderCreation: false,
          isHrtTrtEncounter: false,
          skipAppointmentCreation: false,
        };
        break;

      // ── 2. Standard asynchronous ───────────────────────────────────────────
      // Patient submits info, reviewer reviews later — no live appointment.
      case 'standard-async':
        scenarioFields = {
          reviewType: 'asynchronous',
          serviceQueue: 'internal_staff',
          reviewerId,
          formIds: [],
          skipOrderCreation: false,
          isHrtTrtEncounter: false,
          skipAppointmentCreation: true,
        };
        break;

      // ── 3. HRT encounter ───────────────────────────────────────────────────
      // Hormone Replacement Therapy — treatmentIds optional.
      case 'hrt':
        scenarioFields = {
          reviewType: 'synchronous',
          serviceQueue: 'internal_staff',
          reviewerId,
          formIds: [],
          scheduledDay,
          scheduledTime,
          scheduledTimeZone: 'America/Los_Angeles',
          slotDurationMinutes: 30,
          isHrtTrtEncounter: true,
          skipOrderCreation: false,
          skipAppointmentCreation: false,
        };
        break;

      // ── 4. Provider network ────────────────────────────────────────────────
      // Routes to external provider network instead of internal staff.
      case 'provider-network':
        if (!providerNetworkTenantId) {
          throw new BadRequestException(
            'providerNetworkTenantId is required for provider-network scenario. ' +
            'Pass it in the request body or set WIZLO_PROVIDER_NETWORK_TENANT_ID in .env',
          );
        }
        scenarioFields = {
          reviewType: 'asynchronous',
          serviceQueue: 'provider_network',
          providerNetworkTenantId,
          formIds: [],
          skipOrderCreation: false,
          isHrtTrtEncounter: false,
          skipAppointmentCreation: true,
        };
        break;

      // ── 5. With intake forms ───────────────────────────────────────────────
      // Sends form invitations to the patient via email/SMS on encounter creation.
      case 'with-forms':
        scenarioFields = {
          reviewType: 'synchronous',
          serviceQueue: 'internal_staff',
          reviewerId,
          formIds: dto.formIds || [],
          scheduledDay,
          scheduledTime,
          scheduledTimeZone: 'America/Los_Angeles',
          slotDurationMinutes: 30,
          skipOrderCreation: false,
          isHrtTrtEncounter: false,
          skipAppointmentCreation: false,
        };
        break;

      // ── 6. Skip order creation ─────────────────────────────────────────────
      // Creates the encounter without auto-generating an order.
      // Useful when the order will be created manually at a later step.
      case 'skip-order':
        scenarioFields = {
          reviewType: 'synchronous',
          serviceQueue: 'internal_staff',
          reviewerId,
          formIds: [],
          scheduledDay,
          scheduledTime,
          scheduledTimeZone: 'America/Los_Angeles',
          slotDurationMinutes: 30,
          skipOrderCreation: true,
          isHrtTrtEncounter: false,
          skipAppointmentCreation: false,
        };
        break;

      default:
        throw new BadRequestException(`Unknown scenario: ${dto.scenario}`);
    }

    const payload = { ...base, ...scenarioFields };

    return this.wizlo.request('/encounters', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
