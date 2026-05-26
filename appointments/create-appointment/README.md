# Create Appointment Sample

Demonstrates how to create a new patient appointment via the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials (M2M) authentication with Wizlo
- Creating an appointment via `POST /appointments`
- Supporting both `INPERSON` and `ENCOUNTER` care types
- Optional payment fields — `amount`, `paymentType`, and `transaction` with `userPaymentMethodId`
- The `shouldCreateEncounter` flag (default `true`) to auto-link a Wizlo encounter
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with a full appointment creation form

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET in .env
npm install
npm run dev
# Runs on http://localhost:3040
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3050
```

## API Endpoint

### POST /appointments
Creates an appointment and returns the created appointment object.

```bash
curl -X POST http://localhost:3040/appointments \
  -H 'Content-Type: application/json' \
  -d '{
    "clinicId": "clinic-uuid",
    "patientId": "patient-uuid",
    "providerId": "provider-uuid",
    "careType": "INPERSON",
    "treatmentIds": ["treatment-uuid"],
    "shareVia": "EMAIL",
    "scheduledDay": "2025-09-15",
    "scheduledTime": "14:30:00",
    "scheduledTimeZone": "America/New_York",
    "slotDurationMinutes": 30,
    "shouldCreateEncounter": true
  }'
```

---

## Step-by-Step: How Create Appointment Works

### Step 1 — Get Your Wizlo API Credentials

Put your credentials in `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3040
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id_here
WIZLO_CLIENT_SECRET=your_client_secret_here
```

---

### Step 2 — Authentication Token Generation (M2M / OAuth2)

The backend fetches a Bearer token automatically on the first request.

```
POST https://api-uat.wizlo.com/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "<your client id>",
  "client_secret": "<your client secret>"
}
```

**Token response:**

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

The token is cached in memory and re-used on all subsequent requests.

---

### Step 3 — Create the Appointment

Open the frontend at `http://localhost:3050` and fill in the form.

The backend forwards the request to Wizlo:

```
POST https://api-uat.wizlo.com/appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "clinicId": "clinic-uuid",
  "patientId": "patient-uuid",
  "providerId": "provider-uuid",
  "careType": "INPERSON",
  "treatmentIds": ["treatment-uuid"],
  "shareVia": "EMAIL",
  "scheduledDay": "2025-09-15",
  "scheduledTime": "14:30:00",
  "scheduledTimeZone": "America/New_York",
  "slotDurationMinutes": 30,
  "shouldCreateEncounter": true
}
```

**Example success response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "scheduled",
  "startAt": "2025-09-15T14:30:00.000Z",
  "endAt": "2025-09-15T15:00:00.000Z",
  "scheduledTimeZone": "America/New_York",
  "careType": "INPERSON",
  "patientId": "patient-uuid",
  "providerId": "provider-uuid",
  "clinicId": "clinic-uuid"
}
```

---

### Step 4 — Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `clinicId` | UUID string | Yes | |
| `patientId` | UUID string | Yes | |
| `providerId` | UUID string | Yes | |
| `careType` | `INPERSON` \| `ENCOUNTER` | Yes | |
| `treatmentIds` | string[] | Yes | Array of treatment UUIDs |
| `shareVia` | `EMAIL` \| `SMS` \| `EMAILSMS` | Yes | How the confirmation is sent |
| `scheduledDay` | string | Yes | Format: `YYYY-MM-DD` |
| `scheduledTime` | string | Yes | Format: `HH:mm:ss` |
| `scheduledTimeZone` | string | Yes | IANA e.g. `America/New_York` |
| `slotDurationMinutes` | number | No | Defaults to 30 |
| `notes` | string | No | |
| `formsIds` | string[] | No | Optional intake forms to attach |
| `reviewerId` | string | No | UUID of the reviewing provider |
| `shouldCreateEncounter` | boolean | No | Defaults to `true` |
| `metadata` | object | No | Arbitrary JSON metadata |
| `amount` | number | No | Payment amount |
| `paymentType` | string | No | `full_payment` \| `split_payment` \| `partial_payment` |
| `transaction.methodType` | string | No | `card` \| `cash` \| `bank` |
| `transaction.amount` | number | No | Transaction amount |
| `transaction.userPaymentMethodId` | string | No | Stored payment method UUID |

> **Note:** The correct field name is `userPaymentMethodId` — not `paymentMethodId`.

---

### Step 5 — Error Handling

| Scenario | API Response | Notes |
|---|---|---|
| Missing required field | 400 | Validation error with field details |
| Clinic/patient/provider not found | 404 | Check the UUIDs |
| Slot not available | 409 | Provider has a conflicting appointment |
| Invalid credentials | 401 | Check `WIZLO_CLIENT_ID` and `WIZLO_CLIENT_SECRET` |

---

### Step 6 — Webhook Events

After a successful creation, Wizlo emits:

| Event | Trigger |
|-------|---------|
| `APPOINTMENT_SCHEDULED` | Appointment created successfully |

**Webhook payload fields:** `event`, `module: "appointment"`, `timestamp`, `channel`, `recipient`, `data` (clinicId, patientId, appointmentId, appointmentDate, appointmentTime, scheduledTimeZone, providerName)

---

### Full Request Flow (Summary)

```
Browser (localhost:3050)
  └─ POST /appointments → Backend (localhost:3040)
        └─ Fetches Bearer token from Wizlo (if not cached)
              └─ POST /appointments → Wizlo API (api-uat.wizlo.com)
                    └─ Returns created appointment object → Browser
```
