# Wizlo Encounters Sample

Demonstrates creating a medical encounter in Wizlo using the Wizlo API.

## What This Sample Demonstrates
- OAuth2 client credentials authentication with Wizlo
- Creating a medical encounter via `POST /encounters`
- NestJS backend with a singleton `WizloService` for authenticated API calls
- Next.js 14 App Router frontend with a form UI

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET in .env
npm install
npm run dev
# Runs on http://localhost:3001
```

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3011
```

## API Endpoints

### POST /encounters
Creates a medical encounter in Wizlo.

```bash
curl -X POST http://localhost:3001/encounters \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "49f623c9-0fc3-4e66-9b5e-56c955a71e43",
    "additionalNotes": "Patient requested morning slot",
    "scheduledDay": "2026-05-20",
    "scheduledTime": "10:00:00"
  }'
```
