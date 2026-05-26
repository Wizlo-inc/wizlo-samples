const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3043';

export interface RescheduleAppointmentPayload {
  scheduledDay: string;
  scheduledTime: string;
  scheduledTimeZone: string;
  slotDurationMinutes: number;
  rescheduleReason?: string;
}

export async function rescheduleAppointment(id: string, payload: RescheduleAppointmentPayload) {
  const res = await fetch(`${API_URL}/appointments/${id}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
