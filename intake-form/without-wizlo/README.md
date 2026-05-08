# Wizlo Intake Form — Without Wizlo Integration

Same 4-step intake form UI but saves data locally in memory. Useful for comparing the with/without flows side by side.

## What This Sample Demonstrates
- Identical 4-step form UI as the with-Wizlo version
- In-memory store using a `Map` (no database, no Wizlo calls)
- `crypto.randomUUID()` for ID generation (Node 18+ built-in)
- How to stub out Wizlo integration for local development/testing

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:3004
```

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3014
```

## API Endpoints

### POST /intake/submit
```bash
curl -X POST http://localhost:3004/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "date_of_birth": "1990-01-15",
    "gender": "Female",
    "height_ft": 5,
    "height_in": 6,
    "weight_lbs": 140,
    "activity_level": "Moderately Active",
    "smoking_status": "Never",
    "alcohol_use": "Rarely"
  }'
```

### GET /intake
```bash
curl http://localhost:3004/intake
```
