# Sample 4 — Autopay Management

Demonstrates autopay configuration, payment method management, and manual payment retry for subscriptions with failed payments.

## APIs Covered

| Method  | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/tenants/client-subscriptions/:id/autopay` | Get autopay config, retry settings & saved card |
| `PATCH` | `/tenants/client-subscriptions/:id/autopay` | Enable / disable autopay |
| `PATCH` | `/tenants/client-subscriptions/:id/autopay/payment-method` | Change saved payment method (Gr4vy ID) |
| `POST`  | `/tenants/client-subscriptions/:id/retry-payment` | Manually trigger payment retry |
| `POST`  | `/tenants/client-subscriptions/:id/resend-payment-link` | Email a fresh payment link to the patient |

## Running Locally

```bash
cd backend && cp .env.example .env && npm install && npm run dev   # :3023
cd frontend && cp .env.local.example .env.local && npm install && npm run dev  # :3033
```

## Key DTOs

### Update Autopay
```json
{ "autopayEnabled": true, "autopayPaymentMethodId": "gr4vy-payment-method-id" }
```
> `autopayPaymentMethodId` is required when enabling autopay.

### Change Payment Method
```json
{ "paymentMethodId": "gr4vy-payment-method-id" }
```

### Autopay Response Shape
```json
{
  "subscriptionId": "uuid",
  "autopayEnabled": true,
  "autopayPaymentMethodId": "...",
  "maxPaymentRetries": 3,
  "retryIntervalDays": 3,
  "nextPaymentRetryDate": "2026-05-16T00:00:00Z",
  "consecutiveFailures": 1,
  "paymentMethodDetails": {
    "scheme": "visa",
    "details": { "cardNumberLast4": "4242" },
    "expirationDate": "12/2027"
  },
  "activePaymentLinkUrl": null,
  "activePaymentLinkExpiry": null
}
```
