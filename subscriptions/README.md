# Wizlo Subscription Module — Samples

This directory contains five focused samples covering the full Wizlo Subscription API (30+ endpoints). Each sample is a self-contained NestJS + Next.js 14 application.

## Samples

| # | Folder | What it shows | Backend port | Frontend port |
|---|--------|---------------|:---:|:---:|
| 1 | [`1-plan-management/`](./1-plan-management/) | Create & manage subscription plans (CRUD + status toggle + dashboard counts) | 3020 | 3030 |
| 2 | [`2-enrollment/`](./2-enrollment/) | Enroll a patient into a plan, collect payment via Gr4vy, activate subscription | 3021 | 3031 |
| 3 | [`3-lifecycle-management/`](./3-lifecycle-management/) | Pause, resume, delay, cancel, resubscribe + full audit timeline | 3022 | 3032 |
| 4 | [`4-autopay/`](./4-autopay/) | Autopay toggle, change payment method, retry failed payments | 3023 | 3033 |
| 5 | [`5-patient-portal/`](./5-patient-portal/) | Patient self-service — view, pause, cancel, schedule lab appointments | 3024 | 3034 |

## Recommended Build Order

1. **Plan Management** — No dependencies. Pure CRUD, simplest to run first.
2. **Enrollment** — Requires an existing plan ID.
3. **Lifecycle Management** — Requires an active subscription ID.
4. **Autopay** — Requires an active subscription with a saved payment method.
5. **Patient Portal** — Mirror of samples 2–4 from the patient JWT perspective.

## API Base Paths

| Sample | Wizlo API path |
|--------|---------------|
| Plan Management | `/tenants/subscription-plans` |
| Enrollment | `/tenants/client-subscriptions` (create → checkout → mark-paid) |
| Lifecycle | `/tenants/client-subscriptions/:id/pause|resume|cancel|delay|resubscribe` |
| Autopay | `/tenants/client-subscriptions/:id/autopay` |
| Patient Portal | `/tenants/patient-subscriptions` |

## Environment Variables (all samples)

```
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
WIZLO_TENANT_ID=your_tenant_id
```

Copy the `.env.example` in each `backend/` folder to `.env` before running.

## Subscription Status Machine

```
PENDING ──(mark-paid)──► ACTIVE
ACTIVE  ──(pause)──────► PAUSED
PAUSED  ──(resume)─────► ACTIVE
ACTIVE  ──(cancel)─────► CANCELLED
CANCELLED ─(resubscribe)► PENDING
ACTIVE  ──(autopay fail)► PAYMENT_FAILED
```
