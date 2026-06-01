import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  stateAbbr?: string;
}

export interface ChatThread {
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
  isArchived: boolean;
}

export interface ChatListResponse {
  data: ChatThread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ChatsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Proxy GET /chats-v2 — returns a paginated list of chat threads for the
   * authenticated **clinic staff** user. We forward every supplied filter as a
   * query string; Wizlo ignores any param that is absent.
   *
   * `userEmail` is the staff user whose chat queue we want. The backend mints
   * a user-scoped Wizlo token from this email (via `POST /oauth/user-token`),
   * because the underlying endpoint filters by `req.user.userId` — a plain
   * M2M token has no chat membership and would return an empty list.
   */
  async listThreads(query: ListThreadsQueryDto): Promise<ChatListResponse> {
    const { userEmail, ...wizloQuery } = query;
    const params = new URLSearchParams();
    Object.entries(wizloQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return this.wizlo.requestAsUser<ChatListResponse>(
      userEmail,
      `/chats-v2${qs ? `?${qs}` : ''}`,
    );
  }
}
