# Sample 5 — Patient Portal

Patient-facing self-service endpoints — everything a patient portal would call to view and manage their own subscriptions, including lab appointment scheduling.

## APIs Covered

| Method  | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/tenants/patient-subscriptions` | Patient's own subscription list |
| `GET`   | `/tenants/patient-subscriptions/stats` | Patient's subscription counts |
| `GET`   | `/tenants/patient-subscriptions/:id` | Full details with billing breakdown |
| `GET`   | `/tenants/patient-subscriptions/psc-locations` | Find PSC lab locations by ZIP code |
| `PATCH` | `/tenants/patient-subscriptions/:id/pause` | Patient self-pause |
| `PATCH` | `/tenants/patient-subscriptions/:id/resume` | Patient self-resume |
| `PATCH` | `/tenants/patient-subscriptions/:id/cancel` | Patient self-cancel with reason |
| `PATCH` | `/tenants/patient-subscriptions/:id/delay` | Patient shifts next fulfillment date |
| `PATCH` | `/tenants/patient-subscriptions/:id/schedule-lab` | Book PSC lab appointment |

> **Auth note:** In production these endpoints are called with a **patient JWT**.
> This sample uses the same client-credentials token (staff scope) for demo purposes.

## Running Locally

```bash
cd backend && cp .env.example .env && npm install && npm run dev   # :3024
cd frontend && cp .env.local.example .env.local && npm install && npm run dev  # :3034
```

## Key DTOs

| Action | Fields |
|--------|--------|
| Pause | `pausedUntilDate?` (ISO date) |
| Cancel | `reason` (enum, required), `description?` |
| Delay | `newFulfillmentDate` (ISO date, required) |
| Schedule Lab | `bookingKey` (required), `asyncConfirmation?`, `idempotencyKey?` |

### Schedule Lab Response
```json
{
  "message": "Lab appointment scheduled",
  "labOrderId": "...",
  "subscriptionStatus": "ACTIVE",
  "labAppointment": { ... }
}
```
