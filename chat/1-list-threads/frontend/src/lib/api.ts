const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060';

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
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ThreadFilters {
  userEmail: string;
  status?: string;
  type?: string;
  encounterId?: string;
  search?: string;
  hasUnread?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export async function listThreads(filters: ThreadFilters): Promise<ChatListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const res = await fetch(`${API_URL}/chats/threads?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
