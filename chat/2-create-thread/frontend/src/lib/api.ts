const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3061';

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

export async function createThread(
  encounterId: string,
  patientEmail: string,
): Promise<CreateThreadResponse> {
  const res = await fetch(`${API_URL}/chats/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encounterId, patientEmail }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
