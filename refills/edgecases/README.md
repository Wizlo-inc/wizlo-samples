# Wizlo Refills — Edge Cases

Standalone NestJS + Next.js sample covering refill **failure-mode handling**, broken out from the main [`refills/`](../) app so the happy-path flow stays uncluttered.

> The main refill workflow (eligibility → create → mark paid → submit rx) lives in [`refills/backend`](../backend) + [`refills/frontend`](../frontend). This sample only covers what happens when eligibility fails.

---

## What This Sample Demonstrates

- Two refill failure modes the API returns as `400 REFILL_NOT_ELIGIBLE`:
  - **`no_refills_remaining`** — `refillInfo.remainingRefills === 0`. Not recoverable through the refill API; a new encounter is required.
  - **`cannot_refill_now`** — `refillInfo.canRefillNow === false` while `remainingRefills > 0`. Recoverable either by waiting out the days-of-supply window, or via the staff-only `bypassDaysOfSupply` override.
- A live scanner that walks the patient's encounters and finds a real treatment matching each failure mode, so you can reproduce the 400 against UAT.
- A reference table of all four eligibility `reason` codes and which ones the bypass flag can override.

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
└── frontend/                ← Next.js 14 App Router at :3014
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

| `reason` | Trigger | Bypass via `bypassDaysOfSupply`? |
|---|---|---|
| `no_refills_remaining` | `remainingRefills === 0` | ❌ Needs a new encounter |
| `days_of_supply_not_elapsed` | Too soon since last fill | ✅ Staff-only override |
| `prescription_expired` | Past one-year validity | ❌ Needs a new encounter |
| `treatment_not_indicated` | Treatment never marked indicated | ❌ Reviewer must mark indicated first |

Map these to UI messages and recovery CTAs **before** the user clicks "Refill" — surfacing a 400 to the patient is the wrong UX.
