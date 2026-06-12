# Utilities · 2 — Locations

Reference data for address forms: **countries** and **states** from the Wizlo API,
plus a free-text **city**. Typical use is an address picker
(country → state → city) on patient intake / shipping forms.

## APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Description |
|--------|-----------------|------------------|-------------|
| `GET` | `/locations/countries` | `GET /countries` | All countries (`id`, `name`, `shortName`, `phoneCode`) |
| `GET` | `/locations/states` | `GET /states` | All states with nested `country` (`id`, `name`, `shortName`, `countryId`) |

## ⚠️ Cities are deprecated — city is free text

The Wizlo **City entity is deprecated**. City is now a plain **text field**, so this
sample does **not** call any city endpoint — the frontend captures city as free text.

Cross-checked in the wizlo codebase / swagger:

- `GET /states/:id/cities` → returns **`410 Gone`**: *"City entity is deprecated. City is
  now a text field. Use free-text city names instead of city IDs."*
- The entire `/cities` controller (`GET /cities`, `GET /cities/state/:stateId`,
  `GET /cities/state/:stateId/search`, etc.) is annotated **`[DEPRECATED]`** — kept only
  for backwards compatibility with external partners; new integrations must not use it.

So "cities covered" here means demonstrating the **recommended** pattern: capture city as
free text alongside the API-sourced country + state.

## Authentication

Both list endpoints use the tenant **M2M admin token** from `POST /oauth/token`
(grant `client_credentials`) — see `WizloService.request`.

## Notes

- States carry their parent `country` inline, so you usually don't need to join
  `/countries` and `/states` yourself.
- Responses are **flat arrays** (not wrapped in `{ data: [...] }`).
- `GET /states` also accepts optional `?search=`, `?page=`, `?pageSize=` and there is an
  active `GET /states/country/:countryId` if you want to filter states by country.

## Response shapes

```jsonc
// GET /locations/countries
[{ "id": "5392…", "name": "United States of America", "shortName": "USA", "phoneCode": 1 }]

// GET /locations/states
[{ "id": "bcec…", "name": "Alabama", "shortName": "AL", "countryId": "5392…",
   "country": { "id": "5392…", "name": "United States of America", "shortName": "USA" } }]

// city → free-text string captured client-side, e.g. "Phoenix"
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

The UI loads countries + states on mount; click a state, then type the city as free text
to assemble an address.
