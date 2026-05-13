# Sample 2 — Subscription Enrollment

The core subscription flow: enroll a patient into a plan, collect payment via Gr4vy, and activate the subscription.

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tenants/client-subscriptions` | Create subscription → status `PENDING` |
| `POST` | `/tenants/client-subscriptions/checkout` | Get Gr4vy embed token + amount details |
| `POST` | `/tenants/client-subscriptions/mark-paid` | Activate after Gr4vy payment confirms → status `ACTIVE` |
| `GET`  | `/tenants/client-subscriptions/:id` | Fetch full subscription details |
| `GET`  | `/tenants/client-subscriptions/:id/orders` | View generated orders |
| `GET`  | `/tenants/client-subscriptions/:id/transactions` | View payment transactions |

## Enrollment Flow

```
Step 1: Fill form → POST /client-subscriptions          → PENDING subscription + subscriptionId
Step 2: Pay Now   → POST /client-subscriptions/checkout → Gr4vy token + amount
Step 3: Gr4vy embed loads → patient enters card details
Step 4: On success → POST /client-subscriptions/mark-paid  → ACTIVE
Step 5: Confirmation → GET /client-subscriptions/:id + orders + transactions
```

> **Demo note:** Gr4vy embed requires loading `https://cdn.gr4vy.app/embed.js` and calling
> `new Gr4vy({ token, ... })`. In this sample, Step 3 is simulated — enter the
> `transactionId` returned by Gr4vy to trigger `mark-paid`.

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3021

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3031
```

## Key DTO Fields

### Create Subscription

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `patientId` | `UUID` | ✓ | Patient's Wizlo UUID |
| `subscriptionPlanId` | `string` | ✓ | Numeric plan ID or SP-prefixed string |
| `effectiveDate` | `ISO date` | | Defaults to today |
| `duration` | `number\|null` | | Months; `null` = infinite |
| `clinicId` | `UUID` | | Clinic to associate |
| `deferEncounterCreation` | `boolean` | | Default `false` |

### Checkout

| Field | Type | Required |
|-------|------|:--------:|
| `clientSubscriptionId` | `UUID` | ✓ |
| `couponCode` | `string` | |

### Mark Paid

| Field | Type | Required |
|-------|------|:--------:|
| `clientSubscriptionId` | `UUID` | ✓ |
| `transactionId` | `string` | ✓ (Gr4vy tx ID) |
