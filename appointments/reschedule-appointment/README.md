# Reschedule Appointment Sample

Demonstrates how to reschedule an existing appointment to a new time via the Wizlo API's dedicated reschedule endpoint.

## What This Sample Demonstrates
- OAuth2 client credentials (M2M) authentication with Wizlo
- Rescheduling via `POST /appointments/{id}/reschedule` — **not** `PUT /appointments/{id}`
- The dedicated reschedule endpoint atomically: creates a new appointment, marks the original as `rescheduled`, and sets `rescheduledFrom` / `rescheduledTo` linkage
- `slotDurationMinutes` is **required** in reschedule (unlike update where it is optional)
- `rescheduleReason` — an optional field for audit/display purposes
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with a reschedule form

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET in .env
npm install
npm run dev
# Runs on http://localhost:3043
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3053
```

## API Endpoint

### POST /appointments/:id/reschedule
Reschedules the appointment and returns both the old and new appointment IDs.

```bash
curl -X POST http://localhost:3043/appointments/550e8400-e29b-41d4-a716-446655440000/reschedule \
  -H 'Content-Type: application/json' \
  -d '{
    "scheduledDay": "2025-10-01",
    "scheduledTime": "09:00:00",
    "scheduledTimeZone": "America/New_York",
    "slotDurationMinutes": 30,
    "rescheduleReason": "Patient requested earlier slot"
  }'
```

---

## Step-by-Step: How Reschedule Appointment Works

### Step 1 — Get Your Wizlo API Credentials

Put your credentials in `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3043
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

### Step 3 — Reschedule the Appointment

Open the frontend at `http://localhost:3053`, enter the original appointment UUID and new schedule details.

The backend forwards the request to Wizlo:

```
POST https://api-uat.wizlo.com/appointments/{id}/reschedule
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "scheduledDay": "2025-10-01",
  "scheduledTime": "09:00:00",
  "scheduledTimeZone": "America/New_York",
  "slotDurationMinutes": 30,
  "rescheduleReason": "Patient requested earlier slot"
}
```

**What Wizlo does internally (atomic transaction):**
1. Validates the original appointment exists and is not already rescheduled
2. Validates the new time slot is in the future
3. Creates a new appointment with `status: scheduled` and `rescheduledFrom: <originalId>`
4. Marks the original appointment as `status: rescheduled` with `rescheduledTo: <newId>`
5. Copies any linked encounter appointments and form invitations to the new appointment
6. Emits `APPOINTMENT_RESCHEDULED` webhook event

**Example success response:**

```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "data": {
    "oldAppointmentId": "550e8400-e29b-41d4-a716-446655440000",
    "newAppointmentId": "660e8400-e29b-41d4-a716-446655440001",
    "newAppointment": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "startAt": "2025-10-01T09:00:00.000Z",
      "endAt": "2025-10-01T09:30:00.000Z",
      "status": "scheduled",
      "rescheduledFrom": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

### Step 4 — Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scheduledDay` | string | Yes | Format: `YYYY-MM-DD` |
| `scheduledTime` | string | Yes | Format: `HH:mm:ss` |
| `scheduledTimeZone` | string | Yes | IANA e.g. `America/New_York` |
| `slotDurationMinutes` | integer | **Yes** | Minimum 1 — required (unlike update-appointment where it is optional) |
| `rescheduleReason` | string | No | Optional reason stored on the appointment for audit/display |

---

### Step 5 — Reschedule vs Update

| | `POST /{id}/reschedule` (this sample) | `PUT /{id}` (update-appointment sample) |
|--|--|--|
| Creates new appointment | Yes | No |
| Marks original as `rescheduled` | Yes | No |
| Sets `rescheduledFrom` / `rescheduledTo` | Yes | No |
| Emits `APPOINTMENT_RESCHEDULED` webhook | Yes | No |
| `slotDurationMinutes` | Required | Optional |
| Use when | Patient moves to a different slot | Correcting details on same appointment |

---

### Step 6 — Error Handling

| Scenario | API Response | Notes |
|---|---|---|
| Appointment not found | 404 | Check the UUID |
| Appointment already rescheduled | 400 | Cannot reschedule a rescheduled appointment — use the new appointment ID |
| New time is in the past | 400 | Must be a future date/time |
| Slot not available | 409 | Provider has a conflicting appointment at the new time |
| Invalid credentials | 401 | Check `WIZLO_CLIENT_ID` and `WIZLO_CLIENT_SECRET` |

---

### Step 7 — Webhook Events

| Event | Trigger |
|-------|---------|
| `APPOINTMENT_RESCHEDULED` | Reschedule endpoint called successfully |

**Webhook payload fields:** `event`, `module: "appointment"`, `timestamp`, `channel`, `recipient`, `data` (clinicId, patientId, appointmentId, appointmentDate, appointmentTime, scheduledTimeZone, providerName)

---

### Full Request Flow (Summary)

```
Browser (localhost:3053)
  └─ POST /appointments/:id/reschedule → Backend (localhost:3043)
        └─ Fetches Bearer token from Wizlo (if not cached)
              └─ POST /appointments/{id}/reschedule → Wizlo API (api-uat.wizlo.com)
                    └─ Atomic: creates new appt + marks old as rescheduled
                          └─ Returns { oldAppointmentId, newAppointmentId, newAppointment } → Browser
```
