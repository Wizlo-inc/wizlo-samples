const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3082';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : JSON.stringify(json));
  return json as T;
}

export const DOCUMENT_TYPES = [
  'intake-forms',
  'lab-results',
  'lab-reports',
  'documents',
  'photos',
  'government-ids',
  'identity-documents',
  'medical-records',
  'imaging-scans',
  'prescriptions-medication',
  'insurance-billing',
  'legal-consent',
] as const;

export interface UploadResult {
  message: string;
  documentId: string;
  fileUrl: string;
  userDocument: {
    id: string;
    docType: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
    [key: string]: unknown;
  };
}

export function uploadFromUrl(data: {
  patientId: string;
  documentType: string;
  url: string;
  fileName?: string;
}) {
  return call<UploadResult>('/documents/upload-from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
