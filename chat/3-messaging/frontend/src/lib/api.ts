const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3062';

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

export async function getMessages(
  encounterId: string,
  patientEmail: string,
): Promise<ThreadMessagesResponse> {
  const url = new URL(`${API_URL}/chats/${encodeURIComponent(encounterId)}/messages`);
  url.searchParams.set('patientEmail', patientEmail);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

export async function sendMessage(
  encounterId: string,
  message: string,
  patientEmail: string,
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_URL}/chats/${encodeURIComponent(encounterId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, patientEmail }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
