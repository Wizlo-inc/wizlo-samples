# Wizlo Refills — Edge Cases

Standalone NestJS + Next.js sample covering refill **failure-mode handling**, broken out from the main [`refills/`](../) app so the happy-path flow stays uncluttered.

> The main refill workflow (eligibility → create → mark paid → submit rx) lives in [`refills/backend`](../backend) + [`refills/frontend`](../frontend). This sample only covers what happens when eligibility fails.

---

## What This Sample Demonstrates

- Two refill failure modes the API returns as `400 REFILL_NOT_ELIGIBLE`:
  - **`no_refills_remaining`** — `refillInfo.remainingRefills === 0`. Not recoverable through the refill API; a new encounter is required.
  - **`next_refill_in_x_days`** — `refillInfo.canRefillNow === false` while `remainingRefills > 0`. Recoverable either by waiting out the days-of-supply window, or via the staff-only `bypassDaysOfSupply` override.
- A live scanner that walks the patient's encounters and finds a real treatment matching each failure mode, so you can reproduce the 400 against UAT.
- A reference table of the eligibility `reason` codes and which ones the bypass flag can override.

---

## Folder Structure

```
refills/edgecases/
├── README.md
├── screenshots/
├── backend/                 ← NestJS API at :3004
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── wizlo/           ← OAuth + HTTP helper (shared)
│       ├── eligibility/     ← scan for failing treatments
│       └── refill-orders/   ← reproduce the 400 / exercise bypass
└── frontend/                ← Next.js 15 App Router at :3014
    └── src/
        ├── lib/api.ts
        └── app/
            ├── layout.tsx
            ├── globals.css
            └── page.tsx     ← edge-cases UI (home page)
```

---

## Setup

### 1. Backend (port 3004)

```bash
cd backend
cp .env.example .env
# fill in WIZLO_CLIENT_ID + WIZLO_CLIENT_SECRET (same creds as the main refills app)
npm install
npm run dev
# Refills Edge-Cases backend running on http://localhost:3004
```

### 2. Frontend (port 3014)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# http://localhost:3014
```

> Ports are deliberately chosen so the edge-cases sample can run alongside the main refills app (backend `:3003`, frontend `:3013`) without conflicts.

---

## Backend API surface

| Frontend action | Backend route | Wizlo endpoint |
|---|---|---|
| Scan encounters | `GET /eligibility/encounters?patientId=…` | `GET /tenants/refills/staff/encounters` |
| Inspect treatments | `GET /eligibility/encounter/:id/treatments` | `GET /tenants/refills/staff/encounter/:id/treatments` |
| Attempt failing refill | `POST /refill-orders` | `POST /tenants/refills/staff/create` |
| Staff bypass attempt | `POST /refill-orders` (with `bypassDaysOfSupply: true`) | `POST /tenants/refills/staff/create` |

---

## Eligibility reason reference

The treatments endpoint sets `refillInfo.reason` to the treatment's eligibility `status` whenever `canRefillNow` is `false` (it's omitted when the treatment is refillable). There are only two such values:

| `reason` | Trigger | Bypass via `bypassDaysOfSupply`? |
|---|---|---|
| `no_refills_remaining` | `remainingRefills === 0` **or** the prescription is past its validity date — both collapse into this single `reason` (the backend tracks them apart internally, but this endpoint only exposes the `reason` code) | ❌ Needs a new encounter |
| `next_refill_in_x_days` | Has refills and a valid prescription, but the days-of-supply window since the last fill hasn't elapsed | ✅ Staff-only override |

> Treatments that were never marked `indicated` by the reviewer don't get a reason here — the staff treatments endpoint only returns `indicated` treatments, so non-indicated ones never appear in the list at all.

When a refillable treatment is found, `status` is `refill_required` (and `reason` is omitted).

Map these to UI messages and recovery CTAs **before** the user clicks "Refill" — surfacing a 400 to the patient is the wrong UX.
