# Sample 2 — Create a Patient Chat Thread

Demonstrates how a patient initiates a chat thread for a specific encounter using the Wizlo Chat (V2) API. A thread is the container that all messages for an encounter live in — you create it once, then send/receive messages against it ([Sample 3](../3-messaging)).

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chats-v2/encounter-thread/patient` | Create a patient thread for an encounter (returns existing thread if one already exists) |

## How it works

- A chat thread is **always tied to exactly one encounter**. You must know the encounter's GFE ID (e.g. `EA00000077`) first.
- Creation is **idempotent per encounter**: if a thread already exists, the same thread is returned. Use the `isNew` flag in the response to tell which happened.
- Wizlo resolves the encounter to its order internally — you never pass an order number here.
- The endpoint is **patient-scoped**: Wizlo verifies `encounter.patientId === req.user.userId` on the incoming JWT. A plain M2M token (`POST /oauth/token`) carries the API-client identity, not the patient — so it returns **403 "Not authorized to access this encounter"**.
- The fix: exchange the M2M credentials for a **user-scoped token** via `POST /oauth/user-token` with the patient's email, then call the chat endpoint with that token. The sample does this transparently inside `WizloService.requestAsUser()`.

## Running Locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in your Wizlo credentials
npm install
npm run dev                 # http://localhost:3061

# 2. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3071
```

## Project Structure

```
2-create-thread/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── wizlo/          ← shared Wizlo API client (OAuth2 + fetch)
│       └── chats/
│           ├── chats.controller.ts   ← POST /chats/threads → /chats-v2/encounter-thread/patient
│           ├── chats.service.ts
│           ├── chats.module.ts
│           └── dto/
│               └── create-thread.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx    ← encounter ID input + thread result
        └── lib/
            └── api.ts
```

## Request / Response

**Request**

```json
{ "encounterId": "EA00000077", "patientEmail": "patient@example.com" }
```

The backend uses `patientEmail` to mint a user-scoped Wizlo token and then forwards only `{ encounterId }` to Wizlo.

**Response**

```json
{
  "id": "622f10c5-f7b3-4a8f-b4aa-4217f565d641",
  "status": "created_unassigned",
  "type": "non_medical",
  "subjectUser": { "id": "3e23...", "firstName": "Jerry", "lastName": "Jhones" },
  "assignedTo": { "id": "9159...", "firstName": "Clinic", "lastName": "User" },
  "orderNo": "ORD000004",
  "encounterId": "EA00000077",
  "lastMessage": null,
  "lastMessageSentAt": null,
  "unreadCount": 0,
  "hasTickets": false,
  "ticketCount": 0,
  "isNew": true
}
```

## See Also

- [Chat Integration Guide](https://docs.wizlo.com/guides/chat-integration)
- [Create Chat Thread API reference](https://docs.wizlo.com/api-reference/apis/create-chat-thread)
