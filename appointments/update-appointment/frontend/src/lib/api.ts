const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3041';

export interface UpdateAppointmentPayload {
  scheduledDay: string;
  scheduledTime: string;
  scheduledTimeZone: string;
  shareVia: 'email' | 'sms';
  formsIds?: string[];
  slotDurationMinutes?: number;
  notes?: string;
  providerId?: string;
}

export async function updateAppointment(id: string, payload: UpdateAppointmentPayload) {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
