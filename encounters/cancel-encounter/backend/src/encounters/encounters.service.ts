import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

interface EncounterStatusResponse {
  encounter_id: number;
  encounter_status: string;
}

@Injectable()
export class EncountersService {
  constructor(private readonly wizlo: WizloService) {}

  async getEncounterStatus(encounterId: number): Promise<{ status: string; encounterId: number }> {
    const data = await this.wizlo.request<EncounterStatusResponse>(`/encounters/status`, {
      method: 'POST',
      body: JSON.stringify({ encounter_id: encounterId }),
    });
    return { status: data.encounter_status, encounterId: data.encounter_id };
  }

  async cancelEncounter(encounterId: number) {
    return this.wizlo.request(`/encounters/${encounterId}/cancel`, { method: 'POST' });
  }
}
