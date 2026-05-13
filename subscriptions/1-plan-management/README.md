# Sample 1 — Subscription Plan Management

Demonstrates how to create and manage subscription plans before enrolling patients. Plans define the products, pricing, and fulfillment schedule that patients subscribe to.

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tenants/subscription-plans` | Create a new plan (defaults to `DRAFT`) |
| `GET` | `/tenants/subscription-plans` | List plans with filtering, search & pagination |
| `GET` | `/tenants/subscription-plans/status-counts` | Dashboard counts (DRAFT / ACTIVE / INACTIVE) |
| `GET` | `/tenants/subscription-plans/:id` | Get full plan details |
| `PUT` | `/tenants/subscription-plans/:id` | Update plan fields |
| `PATCH` | `/tenants/subscription-plans/:id/status` | Publish (`ACTIVE`) or deactivate plan |

## Running Locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in your Wizlo credentials
npm install
npm run dev                 # http://localhost:3020

# 2. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3030
```

## Project Structure

```
1-plan-management/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── wizlo/          ← shared Wizlo API client (OAuth2 + fetch)
│       └── plans/
│           ├── plans.controller.ts
│           ├── plans.service.ts
│           ├── plans.module.ts
│           └── dto/
│               ├── create-plan.dto.ts
│               ├── update-plan.dto.ts
│               ├── update-plan-status.dto.ts
│               └── list-plans-query.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx    ← status dashboard + create form + plans table
        └── lib/
            └── api.ts      ← typed fetch wrappers
```

## Key DTO Fields

### Create / Update Plan

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `name` | `string` | ✓ | Max 255 chars |
| `productIds` | `string[]` | ✓ | Array of product UUIDs |
| `planPrice` | `number` | ✓ | Positive, 2 decimal places |
| `fulfillmentCycle` | `DAILY\|WEEKLY\|MONTHLY\|YEARLY` | ✓ | |
| `fulfillmentInterval` | `number` | ✓ | Integer ≥ 1 |
| `reassessmentFormId` | `string (UUID)` | ✓ | |
| `firstPurchaseDiscount` | `number` | | Optional discount amount |
| `maxRenewal` | `number\|null` | | `null` = unlimited renewals |
| `status` | `DRAFT\|ACTIVE\|INACTIVE` | | Defaults to `DRAFT` |
| `planCreatedFor` | `PRODUCT\|SERVICE` | | Defaults to `PRODUCT` |

### Update Status

```json
{ "status": "ACTIVE" }
```

### List Plans Query Parameters

`filter`, `search`, `planCreatedFor`, `fulfillmentCycle`, `sortBy`, `sortOrder`, `page`, `limit`
