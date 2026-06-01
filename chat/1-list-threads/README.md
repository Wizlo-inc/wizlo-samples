# Sample 1 — List Chat Threads

Demonstrates how to fetch a paginated, filterable list of chat threads for a **clinic** tenant using the Wizlo Chat (V2) API. This is the entry point for any chat integration: you list threads, then drill into one to read or send messages (see [Sample 3](../3-messaging)).

> **Tenant note:** This sample targets a **clinic** tenant — `GET /chats-v2` returns threads that belong to the caller's own clinic. A **provider-network** tenant aggregates threads across every clinic it serves and uses a different endpoint — see [Sample 5](../5-provider-network).

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chats-v2` | List chat threads with filtering, search & pagination |

## Auth — why we need a staff email

`GET /chats-v2` filters threads by `req.user.userId`. A plain M2M token (`POST /oauth/token`) has the API-client identity, which has no chat membership in any clinic — so it returns an empty list.

The fix: pass a clinic **staff email** (`userEmail` query param). The backend exchanges it for a user-scoped token via `POST /oauth/user-token`, and Wizlo then returns the chats that staff user can see.

## Running Locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in your Wizlo credentials
npm install
npm run dev                 # http://localhost:3060

# 2. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3070
```

## Project Structure

```
1-list-threads/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── wizlo/          ← shared Wizlo API client (OAuth2 + fetch)
│       └── chats/
│           ├── chats.controller.ts   ← GET /chats/threads → /chats-v2
│           ├── chats.service.ts
│           ├── chats.module.ts
│           └── dto/
│               └── list-threads-query.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx    ← filter form + paginated threads table
        └── lib/
            └── api.ts      ← typed fetch wrapper
```

## Query Parameters

| Param | Type | Notes |
|-------|------|-------|
| `userEmail` | `string` | **Required.** Staff user whose chats to list (minted into a user-scoped Wizlo token) |
| `status` | `active\|resolved\|escalated` | Filter by thread status |
| `type` | `medical\|non_medical` | Filter by thread type |
| `encounterId` | `string` | Single encounter's thread (GFE ID, e.g. `ES000001`) |
| `search` | `string` | Patient name, email, or order number |
| `hasUnread` | `boolean` | Only threads with unread messages |
| `dateFrom` / `dateTo` | ISO 8601 | Created-date range |
| `sortBy` | `createdAt\|lastMessageSentAt\|patientName\|status` | Default `lastMessageSentAt` |
| `sortOrder` | `asc\|desc` | Default `desc` |
| `page` | `number` | Default `1` |
| `limit` | `number` | Default `25`, max `100` |

## Response Shape

```json
{
  "data": [
    {
      "id": "622f10c5-f7b3-4a8f-b4aa-4217f565d641",
      "status": "active",
      "type": "non_medical",
      "isNew": true,
      "subjectUser": { "id": "3e23...", "firstName": "Jerry", "lastName": "Jhones" },
      "assignedTo": { "id": "9159...", "firstName": "Clinic", "lastName": "User" },
      "orderNo": "ORD000004",
      "encounterId": "EA00000001",
      "lastMessage": "Hello, I have a question about my order.",
      "lastMessageSentAt": "2026-03-03T10:05:55.413Z",
      "unreadCount": 0,
      "hasTickets": false,
      "ticketCount": 0,
      "isArchived": false
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 1, "totalPages": 1 }
}
```

> The V2 response intentionally omits Azure Communication Services internals (`externalId`, `externalPatientId`) — third-party integrations only ever work with `encounterId`.

## See Also

- [Chat Integration Guide](https://docs.wizlo.com/guides/chat-integration)
- [List Chat Threads API reference](https://docs.wizlo.com/api-reference/apis/list-chat-threads)
