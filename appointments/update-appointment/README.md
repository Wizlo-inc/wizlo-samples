# Update Appointment Sample

Demonstrates how to update an existing appointment's schedule, provider, and delivery preferences via the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials (M2M) authentication with Wizlo
- Updating an appointment via `PUT /appointments/{id}`
- Appointment IDs are UUID strings (not integers)
- Optional provider change within the same update call
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with an update form

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET in .env
npm install
npm run dev
# Runs on http://localhost:3041
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3051
```

## API Endpoint

### PUT /appointments/:id
Updates the appointment and returns updated appointment details.

```bash
curl -X PUT http://localhost:3041/appointments/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Content-Type: application/json' \
  -d '{
    "scheduledDay": "2025-09-20",
    "scheduledTime": "10:00:00",
    "scheduledTimeZone": "America/Chicago",
    "shareVia": "email",
    "slotDurationMinutes": 45
  }'
```

---

## Step-by-Step: How Update Appointment Works

### Step 1 — Get Your Wizlo API Credentials

Put your credentials in `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3041
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

### Step 3 — Update the Appointment

Open the frontend at `http://localhost:3051`, enter the appointment UUID and new schedule details.

The backend forwards the request to Wizlo:

```
PUT https://api-uat.wizlo.com/appointments/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "scheduledDay": "2025-09-20",
  "scheduledTime": "10:00:00",
  "scheduledTimeZone": "America/Chicago",
  "shareVia": "email",
  "slotDurationMinutes": 45,
  "notes": "Patient requested earlier slot"
}
```

**Example success response:**

```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "scheduled",
    "startAt": "2025-09-20T10:00:00.000Z",
    "endAt": "2025-09-20T10:45:00.000Z",
    "duration": 45,
    "appointmentDate": "2025-09-20",
    "careType": "INPERSON"
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
| `shareVia` | `email` \| `sms` | Yes | How the update notification is sent |
| `formsIds` | string[] | No | Replace attached form UUIDs |
| `slotDurationMinutes` | number | No | New appointment duration |
| `notes` | string | No | Updated notes |
| `providerId` | string | No | Reassign to a different provider |

> **Note:** Appointment IDs are UUID strings — not integers. Use the full UUID from the create appointment response.

> **Note:** To reschedule an appointment and link the old/new records together, use the dedicated `reschedule-appointment` sample instead — it calls `POST /appointments/{id}/reschedule` which sets `rescheduledFrom` / `rescheduledTo` and marks the original as `rescheduled`.

---

### Step 5 — Error Handling

| Scenario | API Response | Notes |
|---|---|---|
| Appointment not found | 404 | Check the UUID |
| Slot not available | 409 | Provider has a conflicting appointment |
| Invalid date format | 400 | Use `YYYY-MM-DD` and `HH:mm:ss` |
| Invalid credentials | 401 | Check `WIZLO_CLIENT_ID` and `WIZLO_CLIENT_SECRET` |

---

### Full Request Flow (Summary)

```
Browser (localhost:3051)
  └─ PUT /appointments/:id → Backend (localhost:3041)
        └─ Fetches Bearer token from Wizlo (if not cached)
              └─ PUT /appointments/{id} → Wizlo API (api-uat.wizlo.com)
                    └─ Returns updated appointment data → Browser
```
