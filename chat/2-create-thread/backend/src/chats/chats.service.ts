import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateThreadDto } from './dto/create-thread.dto';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  stateAbbr?: string;
}

export interface CreateThreadResponse {
  id: string;
  status: 'created_unassigned' | 'active' | 'resolved' | 'escalated';
  type?: 'medical' | 'non_medical';
  subjectUser?: ChatUser;
  assignedTo?: ChatUser;
  orderNo?: string;
  encounterId?: string;
  lastMessage?: string;
  lastMessageSentAt?: string;
  unreadCount: number;
  hasTickets: boolean;
  ticketCount: number;
  isNew: boolean;
}

@Injectable()
export class ChatsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Proxy POST /chats-v2/encounter-thread/patient.
   *
   * The endpoint is patient-scoped — Wizlo checks that the JWT's `sub` is the
   * patient who owns the encounter. We therefore call `requestAsUser` with
   * the patient's email, which transparently exchanges our M2M credentials
   * for a user-scoped token via `POST /oauth/user-token`.
   *
   * Returns the newly created thread, or the existing one if a thread already
   * exists for the encounter. The `isNew` flag tells you which happened.
   */
  async createThread(dto: CreateThreadDto): Promise<CreateThreadResponse> {
    return this.wizlo.requestAsUser<CreateThreadResponse>(
      dto.patientEmail,
      '/chats-v2/encounter-thread/patient',
      {
        method: 'POST',
        body: JSON.stringify({ encounterId: dto.encounterId }),
      },
    );
  }
}
