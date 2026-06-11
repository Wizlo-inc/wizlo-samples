# Utilities · 1 — Available Slots

Fetch open appointment slots. One endpoint, two **types** — matching the two
ways slots are used in the Wizlo flows:

| `type` | Used for | Underlying Wizlo endpoint |
|--------|----------|---------------------------|
| `provider` | Picking a telehealth slot **before scheduling a SYNC encounter** | `GET /appointments/encounter/:encounterId/available-slots?date=YYYY-MM-DD` |
| `lab` | Picking a PSC walk-in lab slot **during subscription enrollment** (lab variants) | `GET /tenants/patient-subscriptions/psc-locations?zipCode=…` |

> **Why one sample, two types?** The ticket lists `get-provider-slots` and
> `get-lab-slots`. They are two operations on the same concept ("available
> slots"), so this sample exposes them through a single `type`-discriminated
> endpoint and a Provider / Lab toggle in the UI.

## APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Auth |
|--------|-----------------|------------------|------|
| `GET` | `/available-slots?type=provider&patientEmail=&encounterId=&date=` | `GET /appointments/encounter/:encounterId/available-slots` | user-scoped |
| `GET` | `/available-slots?type=lab&patientEmail=&zipCode=&lab=&radius=&startDate=` | `GET /tenants/patient-subscriptions/psc-locations` | user-scoped |

## Authentication

Both slot endpoints are **patient-scoped** (`VIEW` on `SCHEDULE` / `SUBSCRIPTIONS`,
plus an ownership check that the encounter / subscription belongs to the caller).
The backend therefore mints a **user-scoped token** from the patient's email via
`POST /oauth/user-token` (grant `client_credentials` + `user_email`) — see
`WizloService.requestAsUser`. The M2M `/oauth/token` flow is also included for
reference but is not used by these endpoints.

## Where this fits

- **Provider (`type=provider`)** — A SYNC encounter sits in `AWAITING_APPOINTMENT`.
  Call this to list the provider network's 7-day availability, let the patient
  pick a slot, then book via `POST /appointments/encounter/schedule`. **Available
  slots must be fetched before a SYNC encounter can be scheduled.**
- **Lab (`type=lab`)** — During subscription enrollment (lab variants 2a / 4a) the
  subscription is in `PENDING_LAB_SCHEDULING`. Call this to list PSC walk-in
  availability near the patient's ZIP, then book the chosen `bookingKey` via
  `PATCH /tenants/patient-subscriptions/:id/schedule-lab`.

## Request / Response shapes

### `type=provider`

Query: `patientEmail` (required), `encounterId` (required), `date` (`YYYY-MM-DD`). The Wizlo
endpoint **requires** `date`; this sample auto-fills today when you omit it, so the call always
sends a valid date. Returns a 7-day window starting from `date`.

```json
{
  "encounterId": 123,
  "timezone": "America/New_York",
  "slots": {
    "2026-06-10": [
      { "start": "09:00:00", "end": "09:30:00", "timezone": "America/New_York" },
      { "start": "10:00:00", "end": "10:30:00", "timezone": "America/New_York" }
    ],
    "2026-06-11": [
      { "start": "14:00:00", "end": "14:30:00", "timezone": "America/New_York" }
    ]
  }
}
```

### `type=lab`

Query: `patientEmail` (required), `zipCode` (required, 5-digit or ZIP+4), `lab` (`quest` | `labcorp`, default `quest`), `radius` (`10` | `20` | `25` | `50` | `100`, default `25`), `startDate` (optional, `YYYY-MM-DD`).

```json
{
  "availability": [
    {
      "date": "2026-02-10",
      "location": {
        "code": "23070",
        "name": "QUEST",
        "address": { "firstLine": "1300 N 12th St", "city": "Phoenix", "state": "AZ", "zipCode": "85006" },
        "distance": 5000,
        "timezone": "America/Phoenix"
      },
      "slots": [
        { "bookingKey": "abc123xyz", "startTime": "2026-02-10T17:00:00+00:00", "endTime": "2026-02-10T19:00:00+00:00", "price": 0, "isPriority": false, "availableCount": 5 }
      ]
    }
  ],
  "timezone": "America/Phoenix"
}
```

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3080

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3090
```

> The patient identified by `patientEmail` must exist in your Wizlo tenant. For
> provider slots, pass the `encounterId` of an existing SYNC encounter
> (`AWAITING_APPOINTMENT`). For lab slots, use a US ZIP code with PSC coverage.
