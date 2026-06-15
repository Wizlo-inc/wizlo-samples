# Wizlo Chat — Sample Implementations

This directory contains sample implementations for the Wizlo Chat integration, organized progressively.

There are **two ways to integrate chat**, and this folder covers both:

- **A. Drop-in widget** — mount Wizlo's prebuilt `@wizlo/chat-widget` React component and write almost no chat code (**Sample 6**). Order-based `/chats/*` API, a **user** token, and Azure Communication Services in the browser for real-time.
- **B. Headless REST** — call the third-party **Chat (V2) API** and build your own UI (**Samples 1–5**). Encounter-based `/chats-v2/*`, a **user-scoped token** (minted from your M2M client credentials via `/oauth/user-token`, because the V2 endpoints filter by the acting user), and Kafka/webhook/polling for real-time. ACS internals are hidden from the V2 responses; every thread is keyed by an **encounter ID** (GFE ID, e.g. `ES000001`).

See the [Chat Integration Guide](https://docs.wizlo.com/guides/chat-integration) for the full picture.

## Samples

| # | Sample | Model | Endpoint(s) | Tenant | Backend | Frontend |
|---|--------|-------|-------------|--------|---------|----------|
| 1 | [List Chat Threads](./1-list-threads) | REST | `GET /chats-v2` | clinic | :3060 | :3070 |
| 2 | [Create a Thread](./2-create-thread) | REST | `POST /chats-v2/encounter-thread/patient` | clinic | :3061 | :3071 |
| 3 | [Messaging](./3-messaging) | REST | `GET` + `POST /chats-v2/:encounterId/messages[/patient]` | clinic | :3062 | :3072 |
| 4 | [Real-time via Kafka](./4-realtime-kafka) | REST | Kafka `chat-message` consumer | clinic | :3063 | :3073 |
| 5 | [Provider Network](./5-provider-network) | REST | `GET /chats/provider-network/chats-list`, `GET /chats-v2/provider-network/encounter-unread-counts` | providernetwork | :3064 | :3074 |
| 6 | [Drop-in Chat Widget](./6-chat-widget) | Widget | `POST /auth/token` → `/oauth/user-token`; widget calls `/chats/*` + ACS | clinic | :3065 | :3075 |

## Which model should I use?

- Want chat working fast with a polished, themeable UI and built-in real-time? Use the **widget** (Sample 6). Closest to the official reference app `wizlo-app/package-test`.
- Need full control over the UI/UX, or are integrating from a non-React/server context? Use the **headless REST** API (Samples 1–5).

## Two tenant types, handled differently

Wizlo has two tenant types and chat is surfaced differently for each:

- **Clinic** — sees only its own threads. Uses `GET /chats-v2` and the messaging endpoints directly (Samples 1–3).
- **Provider network** — serves many clinics, so its *list* and *unread* views **aggregate across every clinic** it serves, and each item is tagged with its owning `tenant`. Uses the `/provider-network/` endpoints (Sample 5).

Messaging itself (create thread, read/send messages) is identical for both — a provider-network user simply acts on behalf of a specific clinic. The split only appears in the aggregated listing/unread views.

## Two ways to receive provider replies

The REST API is request/response only — it cannot notify you when a *provider* replies. Wizlo offers two push channels for that, carrying the same content:

- **Kafka stream** (Sample 4) — an ordered, replayable, offset-tracked per-tenant topic you consume from your server. Best for patient-portal back-ends.
- **Communication webhook** ([webhooks/6-communication-webhook](../webhooks/6-communication-webhook)) — an HTTP POST to a URL you register. Best when you prefer push-over-HTTP.

Sample 3 also shows simple **polling** as a no-infrastructure fallback.

## Architecture

Each sample follows the same pattern as the rest of `wizlo-samples`:

```
backend/
  src/
    main.ts                  # NestJS bootstrap, port config
    app.module.ts            # Root module
    wizlo/
      wizlo.service.ts       # OAuth client-credentials token + request helper
      wizlo.module.ts
    chats/                   # (events/ for Sample 4)
      chats.controller.ts    # Thin proxy to the Wizlo Chat API
      chats.service.ts
      chats.module.ts
      dto/
frontend/
  src/app/page.tsx           # Demo UI for the endpoint(s)
  src/lib/api.ts             # Typed fetch wrappers
```

## Quick Start (individual sample)

```bash
# 1. Backend
cd 1-list-threads/backend
cp .env.example .env         # fill in WIZLO_CLIENT_ID and WIZLO_CLIENT_SECRET
npm install
npm run dev                  # http://localhost:3060

# 2. Frontend (new terminal)
cd 1-list-threads/frontend
cp .env.local.example .env.local
npm install
npm run dev                  # http://localhost:3070
```

## Environment Variables

REST samples (1, 2, 3, 5) use the same base environment:

```env
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
PORT=3060
```

The Kafka sample (4) instead needs `KAFKA_*` connection details — request those from the Wizlo team. See its [README](./4-realtime-kafka).

The widget sample (6) uses the same `WIZLO_*` backend env (its `/auth/token` endpoint mints a **user** token via `/oauth/user-token`), and its frontend additionally pulls `@wizlo/chat-widget` from the package registry — configure registry auth if it is private. See its [README](./6-chat-widget).
