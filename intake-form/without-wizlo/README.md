# Wizlo Intake Form — Without Wizlo Integration

Same 4-step intake form UI but stores data in memory locally. No Wizlo credentials needed. Useful for development, testing, and side-by-side comparison with the with-wizlo variant.

## What This Sample Demonstrates

- In-memory patient store with search, create, and update (`Map` + `crypto.randomUUID()`)
- Mock published forms with realistic schema structure
- Same `{ formId, patientId, structure }` submission shape as the Wizlo API
- How to stub out all Wizlo integration for local development

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

## 4-Step Form Flow

| Step | What happens |
|------|-------------|
| 1 — Patient | Search by email in local store → use existing or create new; optional edit |
| 2 — Select Form | Browse mock published forms → click to view detail |
| 3 — Health Info | Fill personal info, health profile, and medical history |
| 4 — Review & Submit | Confirm all data → save locally → view all submissions |

## API Endpoints

### GET /patients?email=
```bash
curl "http://localhost:3004/patients?email=jane@example.com"
```

### POST /patients
```bash
curl -X POST http://localhost:3004/patients \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com"}'
```

### PUT /patients/:id
```bash
curl -X PUT http://localhost:3004/patients/<PATIENT_ID> \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith"}'
```

### GET /forms
```bash
curl http://localhost:3004/forms
```

### GET /forms/:formId
```bash
curl http://localhost:3004/forms/mock-form-health-intake
```

### GET /forms/:formId/schema
```bash
curl http://localhost:3004/forms/mock-form-health-intake/schema
```

### POST /intake/submit
```bash
curl -X POST http://localhost:3004/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "mock-form-health-intake",
    "patientId": "<PATIENT_ID>",
    "structure": {
      "pages": [{
        "id": "page_intake",
        "rows": [
          { "id": "row_1", "order": 0, "fields": [{ "name": "full_name", "label": "Full Name", "value": "Jane Doe" }] }
        ]
      }]
    }
  }'
```

### GET /intake
```bash
curl http://localhost:3004/intake
```
