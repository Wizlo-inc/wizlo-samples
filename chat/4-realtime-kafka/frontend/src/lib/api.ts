const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3063';

export interface ChatEvent {
  receivedAt: string;
  messageType: string;
  tenantId: string;
  key: string | null;
  offset: string;
  payload: {
    messageId?: string;
    content?: string;
    sender?: { displayName?: string; isPatient?: boolean; avatarUrl?: string | null };
    sentAt?: string;
    deliveryStatus?: string;
    attachments?: string[];
  };
}

export interface EventsResponse {
  connected: boolean;
  topic: string | null;
  consumerGroup: string | null;
  events: ChatEvent[];
  total: number;
}

export async function getEvents(): Promise<EventsResponse> {
  const res = await fetch(`${API_URL}/events`);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

export async function clearEvents(): Promise<void> {
  await fetch(`${API_URL}/events`, { method: 'DELETE' });
}
