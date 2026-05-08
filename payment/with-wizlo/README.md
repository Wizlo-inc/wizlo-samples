# Wizlo Payment — With Wizlo Integration

Creates Wizlo subscriptions for patients and lists existing subscriptions.

## What This Sample Demonstrates
- Creating a subscription via `POST /patients/:patientId/subscriptions`
- Listing subscriptions via `GET /patients/:patientId/subscriptions`
- Plan selection UI with pricing cards (1-month, 3-month, 6-month)
- NestJS backend with singleton `WizloService`

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET
npm install
npm run dev
# Runs on http://localhost:3005
```

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3015
```

## API Endpoints

### POST /subscriptions
```bash
curl -X POST http://localhost:3005/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"patientId":"49f623c9-0fc3-4e66-9b5e-56c955a71e43","planType":"3-month"}'
```

### GET /subscriptions/:patientId
```bash
curl http://localhost:3005/subscriptions/49f623c9-0fc3-4e66-9b5e-56c955a71e43
```
