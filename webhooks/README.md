# Wizlo Webhooks — Sample Implementations

This directory contains sample implementations for all Wizlo webhook types, organized progressively.

## Samples

| # | Sample | Module | Event(s) | Backend | Frontend |
|---|--------|--------|----------|---------|----------|
| 1 | [Manage Webhooks](./1-manage-webhooks) | — | — | :3040 | :3050 |
| 2 | [Encounter Status](./2-encounter-webhook) | encounters | updated | :3041 | :3051 |
| 3 | [Order Status](./3-order-webhook) | orders | updated | :3042 | :3052 |
| 4 | [Product Updates](./4-product-webhook) | products | updated | :3043 | :3053 |
| 5 | [Shipping Updates](./5-shipping-webhook) | shipping | created, updated | :3044 | :3054 |
| 6 | [Communication Messages](./6-communication-webhook) | chats | message_sent | :3045 | :3055 |
| 7 | [Honeybee Raw Data](./7-honeybee-webhook) | rx | honeybee_received | :3046 | :3056 |
| 8 | [Form Lead Generation](./8-form-webhooks) | forms | session_started, progress_saved, completed, product_selected, coupon_used, disqualified, abandoned | :3047 | :3057 |
| 9 | [Notification Events](./9-notification-webhooks) | notification | appointment, encounter | :3048 | :3058 |

## Architecture

Each webhook receiver sample follows the same pattern:

```
backend/
  src/
    main.ts                        # NestJS bootstrap, port config
    app.module.ts                  # Root module
    wizlo/
      wizlo.service.ts             # OAuth client-credentials token + request helper
      wizlo.module.ts
    webhooks/
      webhooks.controller.ts       # POST /webhook/receive, GET/DELETE /webhook/events, POST /webhook/register
      webhooks.service.ts          # Event storage, HMAC verification, Wizlo API registration
      webhooks.module.ts
frontend/
  src/app/page.tsx                 # Registration form + live event log (polls every 3s)
```

## Quick Start (individual sample)

```bash
# 1. Start the backend
cd 2-encounter-webhook/backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET
npm install
npm run dev       # http://localhost:3041

# 2. Start the frontend (new terminal)
cd 2-encounter-webhook/frontend
npm install
npm run dev       # http://localhost:3051

# 3. Expose locally via ngrok (new terminal)
ngrok http 3041   # Copy the https URL

# 4. Open http://localhost:3051 in your browser
# Paste the ngrok URL into "Public Webhook URL" and click Register Webhook

# 5. Trigger the event in Wizlo — events appear in the browser within 3 seconds
```

## Webhook Registration

The `POST /webhook/register` endpoint on each backend calls `POST /tenant/webhooks` to create the webhook config. You can also use **Sample 1 (Manage Webhooks)** to manually create, update, or delete webhook configurations.

## HMAC Signature Verification

Set `WEBHOOK_SECRET` and `WEBHOOK_SIGNING_HEADER` in `.env` to enable payload signature verification. The backend uses `crypto.timingSafeEqual` with HMAC-SHA256 to verify signatures.

```env
WEBHOOK_SECRET=my-secret-key
WEBHOOK_SIGNING_HEADER=x-webhook-signature
```

## Environment Variables

All backends use the same base environment:

```env
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
WEBHOOK_SECRET=optional_signing_secret
WEBHOOK_SIGNING_HEADER=x-webhook-signature
PORT=3041
```

## Testing Without ngrok

For quick local testing, you can send a test payload directly:

```bash
curl -X POST http://localhost:3041/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "actorId": "test-actor",
    "sentAt": "2026-01-05T16:45:15.123Z",
    "eventType": "completed",
    "encounter": {
      "gfe_id": "EA00000009",
      "encounter_id": 9,
      "encounter_status": "completed"
    }
  }'
```

Then open the frontend at http://localhost:3051 to see the event.
