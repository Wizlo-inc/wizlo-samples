# Utilities · 2 — Locations

Reference data for address forms and dropdowns: **countries**, **states**, and
**cities-by-state**. Typical use is a cascading address picker (country → state →
city) on patient intake / shipping forms.

## APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Description |
|--------|-----------------|------------------|-------------|
| `GET` | `/locations/countries` | `GET /countries` | All countries (`id`, `name`, `shortName`, `phoneCode`) |
| `GET` | `/locations/states` | `GET /states` | All states with nested `country` (`id`, `name`, `shortName`, `countryId`) |
| `GET` | `/locations/cities/:stateId?search=` | `GET /cities/state/:stateId/search` | Cities within a state, filtered by `search` (capped at 20) |

## Authentication

All three endpoints use the tenant **M2M admin token** from `POST /oauth/token`
(grant `client_credentials`). They return reference data, not patient-scoped data —
see `WizloService.request`.

## Notes

- **Cities are a search endpoint, not a full list.** `GET /cities/state/:stateId/search`
  returns at most 20 cities and is meant to back a type-ahead. Pass `?search=` to
  filter by name. (Wizlo is migrating cities to a free-text field, so prefer
  capturing city as text and using this endpoint only for suggestions.)
- States carry their parent `country` inline, so you usually don't need to join
  `/countries` and `/states` yourself.
- Responses are **flat arrays** (not wrapped in `{ data: [...] }`).

## Response shapes

```jsonc
// GET /locations/countries
[{ "id": "5392…", "name": "United States of America", "shortName": "USA", "phoneCode": 1 }]

// GET /locations/states
[{ "id": "bcec…", "name": "Alabama", "shortName": "AL", "countryId": "5392…",
   "country": { "id": "5392…", "name": "United States of America", "shortName": "USA" } }]

// GET /locations/cities/bcec…?search=Abb
[{ "id": "ea51…", "name": "Abbeville", "stateId": "bcec…" }]
```

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3081

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3091
```

The UI loads countries + states on mount; click a state to load its cities and
type in the search box to filter.
