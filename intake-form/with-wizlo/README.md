# Wizlo Intake Form — With Wizlo Integration

Full intake flow: collect patient health data → create Wizlo patient → fetch published forms → submit form programmatically.

## What This Sample Demonstrates
- Creating a patient in Wizlo via `POST /clients`
- Fetching published forms via `GET /forms`
- Programmatic form submission via `POST /forms/programmatic/submit`
- 4-step multi-page form with validation in Next.js 14

## Prerequisites
- Node.js 18+

## Running the Backend

```bash
cd backend
cp .env.example .env
# Fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET
npm install
npm run dev
# Runs on http://localhost:3003
```

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3013
```

## API Endpoints

### POST /patients
```bash
curl -X POST http://localhost:3003/patients \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com"}'
```

### GET /forms
```bash
curl http://localhost:3003/forms
```

### GET /forms/:formId/schema
```bash
curl http://localhost:3003/forms/your-form-id/schema
```

### POST /intake/submit
```bash
curl -X POST http://localhost:3003/intake/submit \
  -H "Content-Type: application/json" \
  -d '{"formId":"form-id","patientId":"patient-id","structure":{"pages":[]}}'
```
