const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json as T;
}

// ── Categories ────────────────────────────────────────────────────────────────

export function createCategory(data: {
  categoryName: string;
  reviewOften?: string;
  reviewRecurring?: boolean;
}) {
  return request('/categories', { method: 'POST', body: JSON.stringify(data) });
}

export function listCategories(params?: { page?: number; limit?: number; search?: string }) {
  const qs = params ? new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString() : '';
  return request(`/categories${qs ? `?${qs}` : ''}`);
}

export function getCategoryById(id: string) {
  return request(`/categories/${encodeURIComponent(id)}`);
}

export function updateCategory(id: string, data: {
  categoryName?: string;
  reviewOften?: string;
  reviewRecurring?: boolean;
}) {
  return request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCategory(id: string) {
  return request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Subcategories ─────────────────────────────────────────────────────────────

export function createSubcategory(data: { categoryId: string; subCategoryName: string }) {
  return request('/subcategories', { method: 'POST', body: JSON.stringify(data) });
}

export function listSubcategories(params?: { categoryId?: string; page?: number; limit?: number }) {
  const qs = params ? new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString() : '';
  return request(`/subcategories${qs ? `?${qs}` : ''}`);
}

export function getSubcategoryById(id: string) {
  return request(`/subcategories/${encodeURIComponent(id)}`);
}

export function updateSubcategory(id: string, data: { categoryId?: string; subCategoryName?: string }) {
  return request(`/subcategories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteSubcategory(id: string) {
  return request(`/subcategories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Products ──────────────────────────────────────────────────────────────────

export function createProduct(data: {
  name: string;
  sku: string;
  unitPrice: number;
  pharmacyId: string;
  clinicIds: string[];
  productId: string;
  categoryId: string;
  displayName?: string;
  description?: string;
  subcategoryId?: string;
  isEncounterRequired?: boolean;
  requiresLabs?: boolean;
  productEncounterType?: string;
  encounterMode?: string;
  imageUrl?: string;
  productRx?: {
    drugForm?: string;
    drugStrength?: string;
    directions?: string;
    rxQty?: string;
    rxType?: string;
    refills?: number;
    daysSupply?: number;
    notes?: string;
  };
}) {
  return request('/products', { method: 'POST', body: JSON.stringify(data) });
}

export function listProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}) {
  const qs = params ? new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString() : '';
  return request(`/products${qs ? `?${qs}` : ''}`);
}

export function getProductById(id: string) {
  return request(`/products/${encodeURIComponent(id)}`);
}

export function updateProduct(id: string, data: Record<string, unknown>) {
  return request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteProduct(id: string) {
  return request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
