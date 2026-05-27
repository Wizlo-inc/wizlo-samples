'use client';
import { useState } from 'react';
import {
  createCategory, listCategories, getCategoryById,
  createSubcategory, listSubcategories, getSubcategoryById,
  createProduct, listProducts, getProductById,
} from '@/lib/api';

type Tab = 'categories' | 'subcategories' | 'products';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  return (
    <div className="container">
      <h1>Wizlo Products</h1>
      <p className="subtitle">Manage products, categories, and subcategories via the Wizlo API.</p>

      <div className="tabs">
        <button className={`tab${activeTab === 'categories' ? ' active' : ''}`} onClick={() => setActiveTab('categories')}>Categories</button>
        <button className={`tab${activeTab === 'subcategories' ? ' active' : ''}`} onClick={() => setActiveTab('subcategories')}>Subcategories</button>
        <button className={`tab${activeTab === 'products' ? ' active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
      </div>

      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'subcategories' && <SubcategoriesTab />}
      {activeTab === 'products' && <ProductsTab />}
    </div>
  );
}

// ── Categories Tab ─────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [name, setName] = useState('');
  const [reviewOften, setReviewOften] = useState('');
  const [reviewRecurring, setReviewRecurring] = useState(false);
  const [createResult, setCreateResult] = useState<unknown>(null);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [listResult, setListResult] = useState<unknown>(null);
  const [listError, setListError] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listSearch, setListSearch] = useState('');

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<unknown>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);
    setCreateError('');
    try {
      const data: Record<string, unknown> = { categoryName: name };
      if (reviewOften) data.reviewOften = reviewOften;
      if (reviewRecurring) data.reviewRecurring = reviewRecurring;
      const result = await createCategory(data as Parameters<typeof createCategory>[0]);
      setCreateResult(result);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListLoading(true);
    setListResult(null);
    setListError('');
    try {
      const result = await listCategories(listSearch ? { search: listSearch } : undefined);
      setListResult(result);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setListLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    setLookupError('');
    try {
      const result = await getCategoryById(lookupId.trim());
      setLookupResult(result);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>Create Category</h2>
        <p className="api-note">Maps to <code>POST /admins/products/categories</code> on the Wizlo API.</p>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Category Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weight Loss" required />
          </div>
          <div className="row">
            <div className="form-group">
              <label>Review Frequency</label>
              <select value={reviewOften} onChange={e => setReviewOften(e.target.value)}>
                <option value="">— select —</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUALLY">Annually</option>
                <option value="AS_NEEDED">As Needed</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 26 }}>
              <input
                type="checkbox"
                id="reviewRecurring"
                style={{ width: 'auto' }}
                checked={reviewRecurring}
                onChange={e => setReviewRecurring(e.target.checked)}
              />
              <label htmlFor="reviewRecurring" style={{ marginBottom: 0 }}>Review Recurring</label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create Category'}
          </button>
        </form>
        {createResult != null && (
          <div className="result-box">
            <strong>Category Created</strong>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>Raw API response</summary>
              <pre style={{ marginTop: 8 }}>{JSON.stringify(createResult, null, 2)}</pre>
            </details>
          </div>
        )}
        {createError && <div className="error-box">{createError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>List Categories</h2>
        <p className="api-note">Maps to <code>GET /admins/products/categories</code> on the Wizlo API.</p>
        <form onSubmit={handleList}>
          <div className="form-group">
            <label>Search (optional)</label>
            <input type="text" value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="Filter by name..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={listLoading}>
            {listLoading ? 'Fetching...' : 'List Categories'}
          </button>
        </form>
        {listResult !== null && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <pre>{JSON.stringify(listResult, null, 2)}</pre>
          </div>
        )}
        {listError && <div className="error-box">{listError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>Get Category by ID</h2>
        <p className="api-note">Maps to <code>GET /admins/products/categories/:id</code> on the Wizlo API.</p>
        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label>Category ID *</label>
            <input type="text" value={lookupId} onChange={e => setLookupId(e.target.value)} placeholder="UUID of the category" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
            {lookupLoading ? 'Fetching...' : 'Get Category'}
          </button>
        </form>
        {lookupResult != null && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <pre>{JSON.stringify(lookupResult, null, 2)}</pre>
          </div>
        )}
        {lookupError && <div className="error-box">{lookupError}</div>}
      </div>
    </>
  );
}

// ── Subcategories Tab ──────────────────────────────────────────────────────────

function SubcategoriesTab() {
  const [categoryId, setCategoryId] = useState('');
  const [subName, setSubName] = useState('');
  const [createResult, setCreateResult] = useState<unknown>(null);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [listResult, setListResult] = useState<unknown>(null);
  const [listError, setListError] = useState('');
  const [listLoading, setListLoading] = useState(false);

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<unknown>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);
    setCreateError('');
    try {
      const result = await createSubcategory({ categoryId, subCategoryName: subName });
      setCreateResult(result);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListLoading(true);
    setListResult(null);
    setListError('');
    try {
      const result = await listSubcategories(filterCategoryId ? { categoryId: filterCategoryId } : undefined);
      setListResult(result);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setListLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    setLookupError('');
    try {
      const result = await getSubcategoryById(lookupId.trim());
      setLookupResult(result);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>Create Subcategory</h2>
        <p className="api-note">Maps to <code>POST /admins/products/subcategories</code> on the Wizlo API.</p>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Category ID *</label>
            <input type="text" value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="UUID of the parent category" required />
            <p className="hint">The subcategory will be nested under this category.</p>
          </div>
          <div className="form-group">
            <label>Subcategory Name *</label>
            <input type="text" value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Peptides" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create Subcategory'}
          </button>
        </form>
        {createResult != null && (
          <div className="result-box">
            <strong>Subcategory Created</strong>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>Raw API response</summary>
              <pre style={{ marginTop: 8 }}>{JSON.stringify(createResult, null, 2)}</pre>
            </details>
          </div>
        )}
        {createError && <div className="error-box">{createError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>List Subcategories</h2>
        <p className="api-note">Maps to <code>GET /admins/products/subcategories</code> on the Wizlo API.</p>
        <form onSubmit={handleList}>
          <div className="form-group">
            <label>Filter by Category ID (optional)</label>
            <input type="text" value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)} placeholder="Leave blank to list all subcategories" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={listLoading}>
            {listLoading ? 'Fetching...' : 'List Subcategories'}
          </button>
        </form>
        {listResult !== null && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <pre>{JSON.stringify(listResult, null, 2)}</pre>
          </div>
        )}
        {listError && <div className="error-box">{listError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>Get Subcategory by ID</h2>
        <p className="api-note">Maps to <code>GET /admins/products/subcategories/:id</code> on the Wizlo API.</p>
        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label>Subcategory ID *</label>
            <input type="text" value={lookupId} onChange={e => setLookupId(e.target.value)} placeholder="UUID of the subcategory" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
            {lookupLoading ? 'Fetching...' : 'Get Subcategory'}
          </button>
        </form>
        {lookupResult != null && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <pre>{JSON.stringify(lookupResult, null, 2)}</pre>
          </div>
        )}
        {lookupError && <div className="error-box">{lookupError}</div>}
      </div>
    </>
  );
}

// ── Products Tab ───────────────────────────────────────────────────────────────

function ProductsTab() {
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    sku: '',
    productId: '',
    description: '',
    unitPrice: '',
    pharmacyId: '',
    clinicIds: '',
    categoryId: '',
    subcategoryId: '',
    isEncounterRequired: false,
    requiresLabs: false,
    encounterMode: 'ASYNCHRONOUS',
    productEncounterType: 'STANDARD',
    drugForm: '',
    drugStrength: '',
    directions: '',
    rxQty: '',
    daysSupply: '',
    refills: '',
  });
  const [createResult, setCreateResult] = useState<unknown>(null);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [showRx, setShowRx] = useState(false);

  const [listSearch, setListSearch] = useState('');
  const [listCategoryId, setListCategoryId] = useState('');
  const [listResult, setListResult] = useState<unknown>(null);
  const [listError, setListError] = useState('');
  const [listLoading, setListLoading] = useState(false);

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<unknown>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));
  const setCheck = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.checked }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);
    setCreateError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        sku: form.sku,
        productId: form.productId,
        unitPrice: parseFloat(form.unitPrice),
        pharmacyId: form.pharmacyId,
        clinicIds: form.clinicIds.split(',').map(s => s.trim()).filter(Boolean),
        isEncounterRequired: form.isEncounterRequired,
        requiresLabs: form.requiresLabs,
        encounterMode: form.encounterMode,
        productEncounterType: form.productEncounterType,
      };
      if (form.displayName) payload.displayName = form.displayName;
      if (form.description) payload.description = form.description;
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.subcategoryId) payload.subcategoryId = form.subcategoryId;
      if (showRx && (form.drugForm || form.drugStrength)) {
        const rx: Record<string, unknown> = {};
        if (form.drugForm) rx.drugForm = form.drugForm;
        if (form.drugStrength) rx.drugStrength = form.drugStrength;
        if (form.directions) rx.directions = form.directions;
        if (form.rxQty) rx.rxQty = form.rxQty;
        if (form.daysSupply) rx.daysSupply = parseInt(form.daysSupply, 10);
        if (form.refills) rx.refills = parseInt(form.refills, 10);
        payload.productRx = rx;
      }
      const result = await createProduct(payload as Parameters<typeof createProduct>[0]);
      setCreateResult(result);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListLoading(true);
    setListResult(null);
    setListError('');
    try {
      const params: Record<string, unknown> = {};
      if (listSearch) params.search = listSearch;
      if (listCategoryId) params.categoryId = listCategoryId;
      const result = await listProducts(Object.keys(params).length ? params as Parameters<typeof listProducts>[0] : undefined);
      setListResult(result);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setListLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    setLookupError('');
    try {
      const result = await getProductById(lookupId.trim());
      setLookupResult(result);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>Create Product</h2>
        <p className="api-note">Maps to <code>POST /tenants/products</code> on the Wizlo API.</p>
        <form onSubmit={handleCreate}>
          <div className="form-section-title" style={{ fontWeight: 600, color: '#4a5568', marginBottom: 12 }}>Core Details</div>
          <div className="row">
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Semaglutide 0.5mg" required />
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" value={form.displayName} onChange={set('displayName')} placeholder="Optional display name" />
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <label>SKU *</label>
              <input type="text" value={form.sku} onChange={set('sku')} placeholder="e.g. SEM-0.5-30" required />
            </div>
            <div className="form-group">
              <label>Product ID *</label>
              <input type="text" value={form.productId} onChange={set('productId')} placeholder="e.g. SEM-050" required />
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <label>Unit Price ($) *</label>
              <input type="number" value={form.unitPrice} onChange={set('unitPrice')} placeholder="0.00" min={0} step="0.01" required />
            </div>
            <div className="form-group">
              <label>Pharmacy ID *</label>
              <input type="text" value={form.pharmacyId} onChange={set('pharmacyId')} placeholder="UUID of the pharmacy" required />
            </div>
          </div>
          <div className="form-group">
            <label>Clinic IDs * <span style={{ fontWeight: 400, color: '#718096', fontSize: '0.8rem' }}>(comma-separated UUIDs)</span></label>
            <input type="text" value={form.clinicIds} onChange={set('clinicIds')} placeholder="e.g. uuid1, uuid2" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={set('description')} placeholder="Optional product description" />
          </div>

          <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: 12, marginTop: 20 }}>Categorization</div>
          <div className="row">
            <div className="form-group">
              <label>Category ID * <span style={{ fontWeight: 400, color: '#718096', fontSize: '0.8rem' }}>(copy from Categories tab)</span></label>
              <input type="text" value={form.categoryId} onChange={set('categoryId')} placeholder="UUID of the category" required />
            </div>
            <div className="form-group">
              <label>Subcategory ID <span style={{ fontWeight: 400, color: '#718096', fontSize: '0.8rem' }}>(optional)</span></label>
              <input type="text" value={form.subcategoryId} onChange={set('subcategoryId')} placeholder="UUID of the subcategory" />
            </div>
          </div>

          <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: 12, marginTop: 20 }}>Encounter &amp; Flags</div>
          <div className="row">
            <div className="form-group">
              <label>Encounter Mode</label>
              <select value={form.encounterMode} onChange={set('encounterMode')}>
                <option value="ASYNCHRONOUS">Asynchronous</option>
                <option value="SYNCHRONOUS">Synchronous</option>
              </select>
            </div>
            <div className="form-group">
              <label>Encounter Type</label>
              <select value={form.productEncounterType} onChange={set('productEncounterType')}>
                <option value="STANDARD">Standard</option>
                <option value="HRT">HRT</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
            {(['isEncounterRequired', 'requiresLabs'] as const).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#4a5568', cursor: 'pointer', marginBottom: 0 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form[key] as boolean} onChange={setCheck(key)} />
                {key === 'isEncounterRequired' ? 'Encounter Required' : 'Requires Labs'}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 500, color: '#4a5568', fontSize: '0.875rem' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={showRx} onChange={e => setShowRx(e.target.checked)} />
              Include Prescription (Rx) Details
            </label>
          </div>

          {showRx && (
            <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: 12 }}>Rx Details</div>
              <div className="row">
                <div className="form-group">
                  <label>Drug Form</label>
                  <input type="text" value={form.drugForm} onChange={set('drugForm')} placeholder="e.g. Tablet, Injection" />
                </div>
                <div className="form-group">
                  <label>Drug Strength</label>
                  <input type="text" value={form.drugStrength} onChange={set('drugStrength')} placeholder="e.g. 0.5mg/mL" />
                </div>
              </div>
              <div className="row">
                <div className="form-group">
                  <label>Rx Qty</label>
                  <input type="text" value={form.rxQty} onChange={set('rxQty')} placeholder="e.g. 1 vial" />
                </div>
                <div className="form-group">
                  <label>Days Supply</label>
                  <input type="number" value={form.daysSupply} onChange={set('daysSupply')} placeholder="e.g. 30" min={1} />
                </div>
                <div className="form-group">
                  <label>Refills</label>
                  <input type="number" value={form.refills} onChange={set('refills')} placeholder="e.g. 3" min={0} />
                </div>
              </div>
              <div className="form-group">
                <label>Directions</label>
                <textarea value={form.directions} onChange={set('directions')} placeholder="e.g. Inject 0.5mg subcutaneously once weekly" />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={createLoading}>
            {createLoading ? 'Creating Product...' : 'Create Product'}
          </button>
        </form>
        {createResult != null && (
          <div className="result-box">
            <strong>Product Created</strong>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>Raw API response</summary>
              <pre style={{ marginTop: 8 }}>{JSON.stringify(createResult, null, 2)}</pre>
            </details>
          </div>
        )}
        {createError && <div className="error-box">{createError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>List Products</h2>
        <p className="api-note">Maps to <code>GET /tenants/products</code> on the Wizlo API.</p>
        <form onSubmit={handleList}>
          <div className="row">
            <div className="form-group">
              <label>Search</label>
              <input type="text" value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="Filter by name or SKU..." />
            </div>
            <div className="form-group">
              <label>Filter by Category ID</label>
              <input type="text" value={listCategoryId} onChange={e => setListCategoryId(e.target.value)} placeholder="Optional category UUID" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={listLoading}>
            {listLoading ? 'Fetching...' : 'List Products'}
          </button>
        </form>
        {listResult !== null && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <pre>{JSON.stringify(listResult, null, 2)}</pre>
          </div>
        )}
        {listError && <div className="error-box">{listError}</div>}
      </div>

      <hr className="section-divider" />

      <div className="card">
        <h2>Get Product by ID</h2>
        <p className="api-note">Maps to <code>GET /tenants/products/:id</code> on the Wizlo API.</p>
        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label>Product ID *</label>
            <input type="text" value={lookupId} onChange={e => setLookupId(e.target.value)} placeholder="UUID of the product" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
            {lookupLoading ? 'Fetching...' : 'Get Product'}
          </button>
        </form>
        {lookupResult != null && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <pre>{JSON.stringify(lookupResult, null, 2)}</pre>
          </div>
        )}
        {lookupError && <div className="error-box">{lookupError}</div>}
      </div>
    </>
  );
}
