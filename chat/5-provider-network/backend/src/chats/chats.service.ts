import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';

export interface TenantBasicDetails {
  id: string;
  name: string;
  subdomain: string;
}

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  stateAbbr?: string;
}

/**
 * Shape of each row from `GET /chats/provider-network/chats-list`. This is
 * the V1 `ChatListItemWithTenantDto` — note it still carries `externalId`
 * (the ACS thread id) which the V2 endpoints strip.
 */
export interface ProviderNetworkChatThread {
  id: string;
  externalId: string;
  status: 'created_unassigned' | 'active' | 'resolved' | 'escalated';
  type?: 'medical' | 'non_medical';
  subjectUser?: ChatUser;
  assignedTo?: ChatUser;
  orderNo?: string;
  lastMessage?: string;
  lastMessageSentAt?: string;
  unreadCount: number;
  hasTickets: boolean;
  ticketCount: number;
  isNew: boolean;
  isArchived: boolean;
  // The two fields that make this a *provider-network* response:
  tenantId: string;
  tenant: TenantBasicDetails;
}

export interface ProviderNetworkChatListResponse {
  data: ProviderNetworkChatThread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class ChatsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Proxy GET /chats/provider-network/chats-list.
   *
   * Unlike the clinic-scoped GET /chats-v2, this aggregates chat threads from
   * EVERY clinic the provider network serves. Each item therefore carries a
   * `tenantId` and a `tenant` object so the UI knows which clinic it belongs to.
   *
   * Auth: the underlying endpoint scopes results to the JWT subject's
   * provider-network membership. A plain M2M token has no such membership, so
   * we mint a user-scoped token from `userEmail` first (the network's staff user).
   */
  async listProviderNetworkChats(
    query: ListThreadsQueryDto,
  ): Promise<ProviderNetworkChatListResponse> {
    const { userEmail, ...wizloQuery } = query;
    const params = new URLSearchParams();
    Object.entries(wizloQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return this.wizlo.requestAsUser<ProviderNetworkChatListResponse>(
      userEmail,
      `/chats/provider-network/chats-list${qs ? `?${qs}` : ''}`,
    );
  }

  /**
   * Proxy GET /chats-v2/provider-network/encounter-unread-counts.
   *
   * Returns the numeric IDs of encounters that have unread patient messages,
   * summed across every clinic the network serves. The clinic equivalent is
   * GET /chats-v2/encounter-unread-counts.
   */
  async getProviderNetworkUnreadEncounters(
    userEmail: string,
  ): Promise<{ encounterIds: number[] }> {
    return this.wizlo.requestAsUser<{ encounterIds: number[] }>(
      userEmail,
      '/chats-v2/provider-network/encounter-unread-counts',
    );
  }
}
