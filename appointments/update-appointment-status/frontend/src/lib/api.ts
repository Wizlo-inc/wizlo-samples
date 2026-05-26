const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3042';

export type AppointmentStatus = 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const res = await fetch(`${API_URL}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
