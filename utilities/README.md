# Wizlo Utilities Module — Samples

Three focused, self-contained NestJS + Next.js samples covering the Wizlo
**utility** endpoints — the small cross-cutting calls used by the encounter,
appointment, and subscription-enrollment flows.

## Samples at a Glance

| # | Sample | What it demonstrates | Backend | Frontend |
|---|--------|----------------------|:-------:|:--------:|
| 1 | [Available Slots](#1-available-slots) | Provider telehealth slots & PSC lab slots (`type=provider` / `type=lab`) | `:3080` | `:3090` |
| 2 | [Locations](#2-locations) | Countries, states, and cities-by-state for address forms | `:3081` | `:3091` |
| 3 | [Documents](#3-documents) | Upload a document to a patient from a remote URL | `:3082` | `:3092` |

> **Where these are used**
> - **Available slots is required before a SYNC encounter can be scheduled** — fetch
>   provider availability (`type=provider`), let the patient pick, then schedule.
> - **Available slots also backs lab slot selection during subscription enrollment**
>   (`type=lab`) — list PSC walk-in availability near the patient's ZIP.
> - Locations back the country/state/city dropdowns on intake & shipping forms.
> - Documents-from-URL pulls signed PDFs from external intake / lab providers
>   straight onto a patient's profile.

## Prerequisites

- Node.js 18+
- Wizlo API credentials (see [Environment Variables](#environment-variables))
- For **Available Slots**: a patient that exists in your tenant. Provider slots
  also need an existing SYNC encounter id (`AWAITING_APPOINTMENT`); lab slots need
  a US ZIP with PSC coverage.

---

## 1. Available Slots

Returns open appointment slots. One `type`-discriminated endpoint covers both the
provider and lab use cases the ticket calls `get-provider-slots` and `get-lab-slots`.

<!-- ![Available Slots](./screenshots/1-available-slots.png) -->

### APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Auth |
|--------|-----------------|------------------|------|
| `GET` | `/available-slots?type=provider&patientEmail=&encounterId=&date=` | `GET /appointments/encounter/:encounterId/available-slots` | user-scoped |
| `GET` | `/available-slots?type=lab&patientEmail=&zipCode=&lab=&radius=&startDate=` | `GET /tenants/patient-subscriptions/psc-locations` | user-scoped |

Both slot endpoints are **patient-scoped**, so the backend mints a user token from
`patientEmail` via `POST /oauth/user-token`. See
[`1-available-slots/README.md`](./1-available-slots/README.md) for the full
request / response shapes.

### Running Locally

```bash
# Backend
cd 1-available-slots/backend
cp .env.example .env
npm install
npm run dev                 # http://localhost:3080

# Frontend (new terminal)
cd 1-available-slots/frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3090
```

---

## 2. Locations

Reference data for address forms — a cascading country → state → city picker.

<!-- ![Locations](./screenshots/2-locations.png) -->

### APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Description |
|--------|-----------------|------------------|-------------|
| `GET` | `/locations/countries` | `GET /countries` | All countries |
| `GET` | `/locations/states` | `GET /states` | All states (with nested country) |
| `GET` | `/locations/cities/:stateId?search=` | `GET /cities/state/:stateId/search` | Cities in a state (search, capped 20) |

All three use the tenant **M2M admin token**. See
[`2-locations/README.md`](./2-locations/README.md).

### Running Locally

```bash
# Backend
cd 2-locations/backend
cp .env.example .env
npm install
npm run dev                 # http://localhost:3081

# Frontend (new terminal)
cd 2-locations/frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3091
```

---

## 3. Documents

Attach a document to a patient by handing Wizlo a public file URL — the server
fetches and stores it.

<!-- ![Documents](./screenshots/3-documents.png) -->

### APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Auth |
|--------|-----------------|------------------|------|
| `POST` | `/documents/upload-from-url` | `POST /clients-documents/:id/upload-url/:documentType` | M2M |

Body `{ patientId, documentType, url, fileName? }`. See
[`3-documents/README.md`](./3-documents/README.md) for the document-type list and
response shape.

### Running Locally

```bash
# Backend
cd 3-documents/backend
cp .env.example .env
npm install
npm run dev                 # http://localhost:3082

# Frontend (new terminal)
cd 3-documents/frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3092
```

---

## Authentication summary

| Sample | Token | Why |
|--------|-------|-----|
| Available Slots | **user-scoped** (`POST /oauth/user-token`) | Slots are patient-scoped (`VIEW` on `SCHEDULE` / `SUBSCRIPTIONS` + ownership check) |
| Locations | **M2M admin** (`POST /oauth/token`) | Tenant reference data |
| Documents | **M2M admin** (`POST /oauth/token`) | Admin token required to attach documents |

## Environment Variables

Copy `.env.example` → `.env` in each `backend/` folder:

```env
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
```

The same `WIZLO_CLIENT_ID` / `WIZLO_CLIENT_SECRET` are used both for the M2M token
and to mint user-scoped tokens (Available Slots).

## Screenshots

Capture each running UI into [`screenshots/`](./screenshots/) and uncomment the
image tags above:

| File | Capture |
|------|---------|
| `screenshots/1-available-slots.png` | Provider/Lab toggle with a populated slot grid |
| `screenshots/2-locations.png` | Countries + states columns with a state selected and cities loaded |
| `screenshots/3-documents.png` | Upload result card with the document summary |
