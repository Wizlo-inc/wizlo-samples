# Wizlo Orders Sample

Demonstrates creating orders and viewing subscription orders via the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials authentication with Wizlo
- Creating an order via `POST /orders` → Wizlo `POST /tenants/orders`
- Listing orders for a subscription via `GET /orders/subscription/:id`
- NestJS backend with singleton `WizloService`
- Next.js 14 frontend with two interactive sections

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET
npm install
npm run dev
# Runs on http://localhost:3002
```

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3012
```

## API Endpoints

### POST /orders
```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "49f623c9-0fc3-4e66-9b5e-56c955a71e43",
    "productOfferId": "db6dec31-e0b9-4b5f-bd1f-0bd0a53ff96f",
    "qty": 1
  }'
```

### GET /orders/subscription/:subscriptionId
```bash
curl http://localhost:3002/orders/subscription/your-subscription-id
```
