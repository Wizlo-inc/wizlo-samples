# Cancel Encounter Sample

Demonstrates how to check an encounter's status and cancel it via the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials authentication with Wizlo
- Fetching encounter details (including status) via `GET /encounters/{id}`
- Cancelling an eligible encounter via `POST /encounters/{id}/cancel`
- Status badge in the frontend — green for cancellable statuses, red for non-cancellable
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with status check + cancel flow

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET in .env
npm install
npm run dev
# Runs on http://localhost:3007
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3017
```

## API Endpoints

### GET /encounters/:id/status
Fetches the encounter from Wizlo (`GET /encounters/{id}`) and returns `{ status, encounterId, patientId }`.

```bash
curl http://localhost:3007/encounters/12345/status
```

### POST /encounters/:id/cancel
Cancels an encounter. Returns the updated encounter object.

```bash
curl -X POST http://localhost:3007/encounters/12345/cancel
```

---

## Step-by-Step: How Cancel Encounter Works

### Step 1 — Get Your Wizlo API Credentials

Before anything runs, you need M2M (Machine-to-Machine) credentials from Wizlo.

- `WIZLO_CLIENT_ID` — your app's client ID
- `WIZLO_CLIENT_SECRET` — your app's client secret
- `WIZLO_BASE_URL` — API base URL (default: `https://api-uat.wizlo.com`)

Put these in `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3007
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id_here
WIZLO_CLIENT_SECRET=your_client_secret_here
```

---

### Step 2 — Authentication Token Generation (M2M / OAuth2)

When you make the first API call, the backend automatically fetches a token.

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

The token is cached in memory and automatically attached as a `Bearer` token to every subsequent Wizlo API request.

---

### Step 3 — Check Encounter Status

Open the frontend at `http://localhost:3017`.

Enter an integer encounter ID and click **Check Status**.

The backend calls the dedicated status endpoint:

```
POST https://api-uat.wizlo.com/encounters/status
Authorization: Bearer <access_token>
Content-Type: application/json

{ "encounter_id": 12345 }
```

**Example response:**

```json
{
  "encounter_id": 12345,
  "encounter_status": "awaiting",
  "gfe_no": "EN-1764655275731",
  "gfe_data": [...],
  "order_details": { ... }
}
```

The backend returns `{ status, encounterId }` to the frontend. The frontend displays a **green badge** if the status is cancellable, or a **red badge** if it is not.

**Cancellable statuses:** `AWAITING`, `IN_REVIEW`, `PROCESSING`, `MISSING_ID`

**Non-cancellable statuses:** `COMPLETED`, `CANCELLED`, `REJECTED`, and any other terminal status.

---

### Step 4 — Cancel the Encounter

The **Cancel Encounter** button is enabled only when the current status is cancellable.

After clicking, the backend calls Wizlo directly:

```
POST https://api-uat.wizlo.com/encounters/{id}/cancel
Authorization: Bearer <access_token>
```

> No request body is sent — only the path parameter matters. Wizlo validates eligibility on its end and returns a `400` if the encounter cannot be cancelled.

**Example success response:**

```json
{
  "id": 12345,
  "status": "cancelled",
  "patientId": "49f623c9-0fc3-4e66-9b5e-56c955a71e43",
  ...
}
```

The full updated encounter object is displayed as formatted JSON.

---

### Step 5 — Error Handling

| Scenario | API Response | Frontend Display |
|---|---|---|
| Encounter not found | 404 | "Encounter not found" — check the ID |
| Already completed / cancelled / rejected | 400 | Status shown, explains it cannot be cancelled |
| Invalid credentials | 401 | Auth error displayed |
| Wrong tenant | 403 | "Access denied" — encounter belongs to another tenant |

---

### Step 6 — Webhook Events (After Cancellation)

After a successful cancellation, Wizlo emits a webhook event:

- **Event type:** `encounter.cancelled`
- Provider network encounters auto-sync to the external tenant on cancellation
- **Associated orders are not auto-cancelled** — implement your own business logic to handle them
- **Associated appointments** remain in the system but should be treated as voided

---

### Full Request Flow (Summary)

```
Browser (localhost:3017)
  └─ GET /encounters/:id/status → Backend (localhost:3007)
        └─ Fetches Bearer token from Wizlo (if not cached)
              └─ POST /encounters/status { encounter_id } → Wizlo API (api-uat.wizlo.com)
                    └─ Extracts { status, encounterId } → Browser

  └─ POST /encounters/:id/cancel → Backend (localhost:3007)
        └─ POST /encounters/{id}/cancel (no body) → Wizlo API
              └─ Returns updated encounter JSON → Backend → Browser
```
