import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { SendMessageDto } from './dto/send-message.dto';

/**
 * Shape returned by V2 `GET /chats-v2/:encounterId/messages`. The V2 response
 * transformer strips `externalUserId` from each sender and `externalPatientId`
 * from the thread, so neither field appears here.
 */
export interface MessageSender {
  isCurrentUser: boolean;
  isSystemUser: boolean;
  isPatient: boolean;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export interface ThreadMessage {
  messageId: string;
  content: string;
  sender: MessageSender;
  sentAt: string;
  deliveryStatus: 'read' | 'delivered' | 'sent';
  attachments: string[];
}

export interface ThreadAssignee {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ThreadDetails {
  id: string;
  orderId?: string;
  order?: unknown;
  encounterId?: string;
  threadType: string;
  status: string;
  assignee?: ThreadAssignee;
}

export interface ThreadMessagesResponse {
  thread: ThreadDetails;
  messages: ThreadMessage[];
}

export interface SendMessageResponse {
  messageId: string;
  sentAt: string;
}

@Injectable()
export class ChatsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Proxy GET /chats-v2/:encounterId/messages — full message history plus
   * thread metadata for the given encounter.
   *
   * Both this endpoint and `sendMessage` resolve the encounter via Wizlo's
   * internal `resolveEncounterToOrderNumber()`, which checks
   * `encounter.patientId === req.user.userId`. We therefore mint a user-scoped
   * token from `patientEmail` instead of using the plain M2M token.
   */
  async getMessages(
    encounterId: string,
    patientEmail: string,
  ): Promise<ThreadMessagesResponse> {
    return this.wizlo.requestAsUser<ThreadMessagesResponse>(
      patientEmail,
      `/chats-v2/${encodeURIComponent(encounterId)}/messages`,
    );
  }

  /**
   * Proxy POST /chats-v2/:encounterId/messages/patient — send a message as the
   * patient. Wizlo creates the thread on the fly if it does not yet exist.
   */
  async sendMessage(
    encounterId: string,
    dto: SendMessageDto,
  ): Promise<SendMessageResponse> {
    return this.wizlo.requestAsUser<SendMessageResponse>(
      dto.patientEmail,
      `/chats-v2/${encodeURIComponent(encounterId)}/messages/patient`,
      {
        method: 'POST',
        body: JSON.stringify({ message: dto.message }),
      },
    );
  }
}
