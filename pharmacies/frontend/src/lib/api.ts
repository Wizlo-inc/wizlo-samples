const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007';

export interface PharmacyBasicInfo {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  fax?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  countryId?: string;
  stateId?: string;
  [key: string]: unknown;
}

// Top-level object returned by GET /tenants/pharmacies and GET /tenants/pharmacies/:id
// id here is the TenantPharmacy assignment id (used for PATCH calls)
export interface TenantPharmacy {
  id: string;
  tenantId?: string;
  pharmacy: PharmacyBasicInfo;
  isActive: boolean;
  isLive: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ListPharmaciesResponse {
  data: TenantPharmacy[];
  meta: PaginationMeta;
}

export interface ListPharmaciesParams {
  search?: string;
  isActive?: boolean;
  isLive?: boolean;
  page?: number;
  limit?: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

export function listPharmacies(params: ListPharmaciesParams = {}): Promise<ListPharmaciesResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive));
  if (params.isLive !== undefined) qs.set('isLive', String(params.isLive));
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return request(`/pharmacies${query ? `?${query}` : ''}`);
}

export function getPharmacy(id: string): Promise<TenantPharmacy> {
  return request(`/pharmacies/${id}`);
}

export function updatePharmacyStatus(id: string, isActive: boolean): Promise<TenantPharmacy> {
  return request(`/pharmacies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function updatePharmacyLive(id: string, isLive: boolean): Promise<TenantPharmacy> {
  return request(`/pharmacies/${id}/live`, {
    method: 'PATCH',
    body: JSON.stringify({ isLive }),
  });
}
