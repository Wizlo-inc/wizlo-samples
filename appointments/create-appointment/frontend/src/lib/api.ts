const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040';

export interface CreateAppointmentPayload {
  clinicId: string;
  patientId: string;
  providerId: string;
  careType: 'INPERSON' | 'ENCOUNTER';
  treatmentIds: string[];
  shareVia: 'EMAIL' | 'SMS' | 'EMAILSMS';
  scheduledDay: string;
  scheduledTime: string;
  scheduledTimeZone: string;
  slotDurationMinutes?: number;
  notes?: string;
  formsIds?: string[];
  reviewerId?: string;
  shouldCreateEncounter?: boolean;
  metadata?: Record<string, unknown>;
  amount?: number;
  paymentType?: 'full_payment' | 'split_payment' | 'partial_payment';
  transaction?: {
    methodType: 'card' | 'cash' | 'bank';
    amount: number;
    userPaymentMethodId?: string;
    securityCode?: string;
    checkoutSessionId?: string;
    shouldStore?: boolean;
  };
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const res = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
