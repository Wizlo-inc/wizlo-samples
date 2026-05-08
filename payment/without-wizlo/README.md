# Wizlo Payment — Without Wizlo Integration

Same plan selection UI but stores subscriptions locally in memory. No Wizlo API calls.

## What This Sample Demonstrates
- Identical plan-card UI as the with-Wizlo version
- In-memory store using a `Map`
- `crypto.randomUUID()` for ID generation (Node 18+ built-in)
- How to stub out Wizlo payment integration for local testing

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:3006
```

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3016
```

## API Endpoints

### POST /subscriptions
```bash
curl -X POST http://localhost:3006/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"patientId":"patient-123","planType":"6-month","email":"patient@example.com"}'
```

### GET /subscriptions
```bash
curl http://localhost:3006/subscriptions
```
