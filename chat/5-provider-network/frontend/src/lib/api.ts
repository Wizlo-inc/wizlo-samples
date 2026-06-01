const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3064';

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

export interface ThreadFilters {
  userEmail: string;
  status?: string;
  type?: string;
  search?: string;
  hasUnread?: boolean;
  page?: number;
  limit?: number;
}

export async function listProviderNetworkChats(
  filters: ThreadFilters,
): Promise<ProviderNetworkChatListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const res = await fetch(`${API_URL}/chats/provider-network/chats-list?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

export async function getUnreadEncounters(
  userEmail: string,
): Promise<{ encounterIds: number[] }> {
  const url = new URL(`${API_URL}/chats/provider-network/unread-encounters`);
  url.searchParams.set('userEmail', userEmail);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
