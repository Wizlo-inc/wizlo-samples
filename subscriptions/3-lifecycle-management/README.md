# Sample 3 — Subscription Lifecycle Management

Demonstrates all admin-side state transitions for an active subscription — pause, resume, delay, cancel, resubscribe — plus the full audit timeline.

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`   | `/tenants/client-subscriptions` | List subscriptions with status / search filters |
| `GET`   | `/tenants/client-subscriptions/stats` | Dashboard counts by status |
| `PATCH` | `/tenants/client-subscriptions/:id/pause` | Pause (optional `pausedUntilDate`) |
| `PATCH` | `/tenants/client-subscriptions/:id/resume` | Resume a paused subscription |
| `PATCH` | `/tenants/client-subscriptions/:id/cancel` | Cancel with reason |
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
| Cancel | `reason` (enum), `description?` |
| Delay | `newFulfillmentDate` (ISO date, required) |
| Resubscribe | no body |
| Resume | no body |

### Cancellation Reasons
- `I am experiencing too many side effects`
- `Completed the current treatment`
- `Too expensive`
- `Using another company's product`
- `Health or medical reasons`
- `Others`
