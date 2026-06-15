# Sample 3 — Subscription Lifecycle Management

Demonstrates all admin-side state transitions for an active subscription — pause, resume, delay, cancel, resubscribe — plus the full audit timeline.

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`   | `/tenants/client-subscriptions` | List subscriptions with status / search filters |
| `GET`   | `/tenants/client-subscriptions/stats` | Dashboard counts by status |
| `PATCH` | `/tenants/client-subscriptions/:id/pause` | Pause (optional `pausedUntilDate`) |
| `PATCH` | `/tenants/client-subscriptions/:id/resume` | Resume a paused subscription |
| `PATCH` | `/tenants/client-subscriptions/:id/cancel` | Cancel a subscription (admin — no request body; see note under Key DTOs) |
| `PATCH` | `/tenants/client-subscriptions/:id/delay` | Push next fulfillment date |
| `PATCH` | `/tenants/client-subscriptions/:id/resubscribe` | Re-enroll a cancelled subscription |
| `GET`   | `/tenants/client-subscriptions/:id/timeline` | Full audit trail with timestamps |

## Status Machine

```
PENDING      ──(mark-paid)────► ACTIVE
ACTIVE       ──(pause)────────► PAUSED
PAUSED       ──(resume)───────► ACTIVE
ACTIVE       ──(cancel)───────► CANCELLED
CANCELLED    ──(resubscribe)──► PENDING
ACTIVE       ──(delay)────────► ACTIVE  (next fulfillment date shifted)
PAYMENT_FAILED ──(retry)──────► ACTIVE
```

## Running Locally

```bash
cd backend && cp .env.example .env && npm install && npm run dev   # :3022
cd frontend && cp .env.local.example .env.local && npm install && npm run dev  # :3032
```

## Key DTOs

| Action | Fields |
|--------|--------|
| Pause | `pausedUntilDate?` (ISO date) |
| Cancel | none — the admin endpoint takes no request body (see note) |
| Delay | `newFulfillmentDate` (ISO date, required) |
| Resubscribe | no body |
| Resume | no body |

> **Cancellation reason — admin vs patient:** The admin endpoint `PATCH /tenants/client-subscriptions/:id/cancel` takes **no request body** and cancels immediately without recording a reason. The `reason` / `description` shape (and the reason list below) belongs to the **patient** cancel endpoint `PATCH /tenants/patient-subscriptions/:id/cancel` (Sample 5), where `reason` is required. This sample keeps a reason picker so the UI mirrors that contract, but the admin API ignores the body.

### Cancellation Reasons (consumed by the patient cancel endpoint — Sample 5)
- `I am experiencing too many side effects`
- `Completed the current treatment`
- `Too expensive`
- `Using another company's product`
- `Health or medical reasons`
- `Others`
