# Provider Network Encounter Sample

Demonstrates creating an encounter routed to an external provider network in Wizlo using the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials authentication with Wizlo
- Creating an encounter via `POST /encounters` with `serviceQueue: "provider_network"`
- Routing an encounter to an external provider network instead of internal staff
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with a form UI

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID, WIZLO_CLIENT_SECRET, and WIZLO_PROVIDER_NETWORK_TENANT_ID in .env
npm install
npm run dev
# Runs on http://localhost:3004
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3014
```

## API Endpoints

### POST /encounters
Creates a provider network encounter in Wizlo.

```bash
curl -X POST http://localhost:3004/encounters \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "49f623c9-0fc3-4e66-9b5e-56c955a71e43",
    "providerNetworkTenantId": "your-provider-network-tenant-uuid",
    "additionalNotes": "Routing to external network"
  }'
```

---

## Step-by-Step: How Provider Network Encounter Creation Works

### Step 1 — Get Your Wizlo API Credentials

Before anything runs, you need M2M (Machine-to-Machine) credentials from Wizlo, plus a provider network tenant ID.

- `WIZLO_CLIENT_ID` — your app's client ID
- `WIZLO_CLIENT_SECRET` — your app's client secret
- `WIZLO_BASE_URL` — API base URL (default: `https://api-uat.wizlo.com`)
- `WIZLO_PROVIDER_NETWORK_TENANT_ID` — the UUID of the external provider network tenant

Put these in `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3004
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id_here
WIZLO_CLIENT_SECRET=your_client_secret_here
WIZLO_CLINIC_ID=1d836ade-bb7e-47a5-9f4a-d2c45ad8dad6
WIZLO_PHARMACY_ID=51ddaed0-69d2-4ad2-a474-19d2d90e8ac6
WIZLO_PROVIDER_NETWORK_TENANT_ID=your_provider_network_tenant_id
```

> `WIZLO_PROVIDER_NETWORK_TENANT_ID` can also be passed directly in the request body. If omitted from both, the request will fail with a 400 error.

> No `WIZLO_REVIEWER_ID` is needed — provider network encounters are not assigned to an internal reviewer.

---

### Step 2 — Authentication Token Generation (M2M / OAuth2)

When you make the first API call, the backend automatically fetches a token. You do **not** need to do this manually — it happens behind the scenes.

**What happens internally:**

The backend (`backend/src/wizlo/wizlo.service.ts`) sends this request to Wizlo:

```
POST https://api-uat.wizlo.com/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "<your client id>",
  "client_secret": "<your client secret>"
}
```

**Token response from Wizlo:**

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

The token is cached in memory and automatically attached as a `Bearer` token to every subsequent Wizlo API request. You do not need to manage it.

---

### Step 3 — Fill In the Encounter Form

Open the frontend at `http://localhost:3014`.

![Provider Network Encounter Form](screenshots/provider-network-encounter.png)

Fill in the fields:

**Patient ID** *(required)*
The unique ID of the patient in Wizlo. Must be a UUID.
Example: `49f623c9-0fc3-4e66-9b5e-56c955a71e43`

**Provider Network Tenant ID** *(required)*
The UUID of the external provider network tenant to route this encounter to.
Example: `b7e2a1c4-3d5f-4e90-8a12-1f6c7d8e9b0a`

> If set via `WIZLO_PROVIDER_NETWORK_TENANT_ID` in `.env`, this field can be left blank in the form.

**Treatment IDs** *(optional)*
Treatments to include in this encounter. Enter multiple IDs separated by commas.

**Additional Notes** *(optional)*
Any free-text notes — e.g. `Routing to external network`.

> No scheduling fields — provider network encounters are asynchronous and do not book a live appointment.

---

### Step 4 — What Gets Sent to the Wizlo API

After you click **Create Encounter**, the backend builds a full payload and sends it to Wizlo:

```
POST https://api-uat.wizlo.com/encounters
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body:**

```json
{
  "clinicId": "<from WIZLO_CLINIC_ID env>",
  "pharmacyId": "<from WIZLO_PHARMACY_ID env>",
  "patientId": "<from your form input>",
  "providerNetworkTenantId": "<from form input or WIZLO_PROVIDER_NETWORK_TENANT_ID env>",
  "additionalNotes": "Routing to external network",
  "treatmentIds": [],
  "formIds": [],
  "documentIds": [],
  "reviewType": "asynchronous",
  "serviceQueue": "provider_network",
  "source": "FORMS",
  "isCommissionWaived": false,
  "skipOrderCreation": false,
  "isHrtTrtEncounter": false,
  "allowUnassignedOnFailure": true,
  "skipAppointmentCreation": true
}
```

> Key differences from a standard encounter:
> - `serviceQueue: "provider_network"` — routes to external provider instead of internal staff
> - `reviewType: "asynchronous"` — no live appointment; reviewed at the provider's availability
> - `skipAppointmentCreation: true` — no appointment slot is booked
> - No `reviewerId` — the provider network handles assignment

---

### Step 5 — Response

On success, the Wizlo API returns the created encounter object. It is displayed on the frontend as formatted JSON.

**Example success response:**

```json
{
  "id": "enc-uuid-here",
  "patientId": "49f623c9-0fc3-4e66-9b5e-56c955a71e43",
  "clinicId": "1d836ade-bb7e-47a5-9f4a-d2c45ad8dad6",
  "status": "pending",
  ...
}
```

**On validation error (400):** The backend returns a descriptive error — e.g. if `patientId` or `providerNetworkTenantId` is missing.

**On API error:** The error message from Wizlo is forwarded and shown in a red box on the frontend.

---

### Full Request Flow (Summary)

```
Browser (localhost:3014)
  └─ POST /encounters → Backend (localhost:3004)
        └─ Fetches Bearer token from Wizlo (if not cached)
              └─ POST /encounters → Wizlo API (api-uat.wizlo.com)
                    └─ Returns encounter JSON → Backend → Browser
```
