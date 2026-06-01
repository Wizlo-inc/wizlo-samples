# Sample 5 — Provider Network Chats (cross-clinic)

Demonstrates how chat works for a **provider-network** tenant, and how that differs from a **clinic** tenant. This is the "two tenant types are handled differently" part of the Wizlo chat model.

## Clinic vs Provider Network

| | **Clinic** tenant | **Provider-network** tenant |
|---|---|---|
| Scope | Sees only **its own** chat threads | Aggregates threads from **every clinic it serves** |
| List endpoint | `GET /chats-v2` ([Sample 1](../1-list-threads)) | `GET /chats/provider-network/chats-list` |
| Unread counts | `GET /chats-v2/encounter-unread-counts` | `GET /chats-v2/provider-network/encounter-unread-counts` |
| Response items | No tenant info (single clinic implied) | Each item adds `tenantId` + `tenant { id, name, subdomain }` |
| Pagination | `total, page, limit, totalPages` | …plus `hasNext`, `hasPrev` |

Messaging itself (create thread, read/send messages — Samples 2 & 3) is unchanged: a provider-network user acts **on behalf of a specific clinic**. Only the *listing* and *unread* views aggregate, because that is where a network user needs the cross-clinic picture.

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chats/provider-network/chats-list` | Chat threads aggregated across all served clinics (with tenant tag) |
| `GET` | `/chats-v2/provider-network/encounter-unread-counts` | Encounter IDs with unread messages, across all served clinics |

## Auth — why we need a provider-network user email

Both endpoints scope results to the JWT subject's provider-network membership. A plain M2M token (`POST /oauth/token`) carries the API-client identity, which has no such membership — so it returns no rows.

The fix: pass a **provider-network staff email** (`userEmail` query param). The backend exchanges it for a user-scoped Wizlo token via `POST /oauth/user-token`, and Wizlo then returns the threads / unread counts the network user can see.

## Running Locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # use credentials for a PROVIDER-NETWORK tenant
npm install
npm run dev                 # http://localhost:3064

# 2. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3074
```

> Use credentials issued to a **provider-network** tenant. With clinic credentials these endpoints return only that clinic's data (or `403` for cross-tenant access).

## Project Structure

```
5-provider-network/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── wizlo/          ← shared Wizlo API client (OAuth2 + fetch)
│       └── chats/
│           ├── chats.controller.ts   ← /chats/provider-network/*
│           ├── chats.service.ts
│           ├── chats.module.ts
│           └── dto/
│               └── list-threads-query.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx    ← clinic-tagged threads table + unread encounters
        └── lib/
            └── api.ts
```

## Response Shape (chats-list)

```json
{
  "data": [
    {
      "id": "622f10c5-...",
      "externalId": "19:meeting_...@thread.v2",
      "status": "active",
      "type": "non_medical",
      "subjectUser": { "id": "3e23...", "firstName": "Jerry", "lastName": "Jhones" },
      "orderNo": "ORD000004",
      "unreadCount": 2,
      "hasTickets": false,
      "ticketCount": 0,
      "isNew": true,
      "isArchived": false,
      "tenantId": "9b1c...",
      "tenant": { "id": "9b1c...", "name": "Downtown Clinic", "subdomain": "downtown" }
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 1, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

## See Also

- [Chat Integration Guide](https://docs.wizlo.com/guides/chat-integration)
- [Provider Network overview](https://docs.wizlo.com/guides/provider-network-overview)
- [Sample 1 — List Chat Threads (clinic)](../1-list-threads)
