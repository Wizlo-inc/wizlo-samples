# Update Appointment Status Sample

Demonstrates how to move an appointment through its lifecycle by updating its status via the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials (M2M) authentication with Wizlo
- Updating appointment status via `PATCH /appointments/{id}/status`
- The correct 5-value status enum (`checked_in`, `in_progress`, `completed`, `cancelled`, `no_show`)
- Why `checked_out` does not exist and `in_progress` is the correct equivalent
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with a status dropdown and lifecycle diagram

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET in .env
npm install
npm run dev
# Runs on http://localhost:3042
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3052
```

## API Endpoint

### PATCH /appointments/:id/status
Updates the appointment status and returns the updated record.

```bash
curl -X PATCH http://localhost:3042/appointments/550e8400-e29b-41d4-a716-446655440000/status \
  -H 'Content-Type: application/json' \
  -d '{ "status": "checked_in" }'
```

---

## Step-by-Step: How Update Appointment Status Works

### Step 1 — Get Your Wizlo API Credentials

Put your credentials in `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3042
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

Token is cached in memory and re-used on all subsequent requests.

---

### Step 3 — Update the Status

Open the frontend at `http://localhost:3052`, enter the appointment UUID and select a new status.

The backend forwards the request to Wizlo:

```
PATCH https://api-uat.wizlo.com/appointments/{id}/status
Authorization: Bearer <access_token>
Content-Type: application/json

{ "status": "checked_in" }
```

**Example success response:**

```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "checked_in",
    "updatedAt": "2025-09-15T14:05:00.000Z"
  }
}
```

---

### Step 4 — Status Reference

| Status | Description | Triggers Webhook |
|--------|-------------|-----------------|
| `checked_in` | Patient arrived at the clinic | — |
| `in_progress` | Appointment is underway (replaces `checked_out` from older docs) | — |
| `completed` | Appointment finished successfully | `APPOINTMENT_COMPLETED` |
| `cancelled` | Appointment cancelled manually | `APPOINTMENT_CANCELLED` |
| `no_show` | Patient did not attend | `APPOINTMENT_NO_SHOW` |

> **Important:** `checked_out` is **not** a valid status. The `FeToApiAppointmentStatusMap` in wizlo-app maps the UI's "checked out" concept to `in_progress`. Always use `in_progress`.

> **Note:** `scheduled` and `rescheduled` are system-managed statuses set automatically. You cannot set them manually via this endpoint.

> **Note:** Appointment IDs are UUID strings — not integers.

---

### Step 5 — Status Lifecycle

```
scheduled
  └─ checked_in
       └─ in_progress
            └─ completed

Any status → cancelled  (APPOINTMENT_CANCELLED webhook)
Any status → no_show    (APPOINTMENT_NO_SHOW webhook)
```

---

### Step 6 — Error Handling

| Scenario | API Response | Notes |
|---|---|---|
| Appointment not found | 404 | Check the UUID |
| Invalid status value | 400 | Only the 5 values above are accepted |
| Invalid credentials | 401 | Check `WIZLO_CLIENT_ID` and `WIZLO_CLIENT_SECRET` |

---

### Step 7 — Webhook Events

| Event | Trigger |
|-------|---------|
| `APPOINTMENT_COMPLETED` | Status set to `completed` |
| `APPOINTMENT_CANCELLED` | Status set to `cancelled` |
| `APPOINTMENT_NO_SHOW` | Status set to `no_show` |

**Webhook payload fields:** `event`, `module: "appointment"`, `timestamp`, `channel`, `recipient`, `data` (clinicId, patientId, appointmentId, appointmentDate, appointmentTime, scheduledTimeZone, providerName)

---

### Full Request Flow (Summary)

```
Browser (localhost:3052)
  └─ PATCH /appointments/:id/status → Backend (localhost:3042)
        └─ Fetches Bearer token from Wizlo (if not cached)
              └─ PATCH /appointments/{id}/status → Wizlo API (api-uat.wizlo.com)
                    └─ Returns { success, message, data: { id, status, updatedAt } } → Browser
```
