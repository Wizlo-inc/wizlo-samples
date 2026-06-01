# Sample 3 — Chat Messaging (read history + send)

Demonstrates the two message operations of the Wizlo Chat (V2) API: reading a thread's full history and sending a message as the patient. The frontend is a working chat window that **polls** for new messages so provider replies appear automatically.

## APIs Covered

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chats-v2/:encounterId/messages` | Get thread metadata + full message history |
| `POST` | `/chats-v2/:encounterId/messages/patient` | Send a message as the patient |

## How it works

- Both operations key off the **encounter ID** (GFE ID, e.g. `EA00000077`) — no thread ID or order number needed.
- Both endpoints are **patient-scoped**: Wizlo checks `encounter.patientId === req.user.userId`. A plain M2M token (`POST /oauth/token`) carries the API-client identity, not the patient — so it would return **403 "Not authorized to access this encounter"**. The backend therefore mints a **user-scoped token** for the patient via `POST /oauth/user-token` (see `WizloService.requestAsUser`). The frontend supplies `patientEmail` alongside the encounter ID.
- `POST .../messages/patient` will **create the thread on the fly** if it does not exist, so you can message an encounter without calling [Sample 2](../2-create-thread) first.
- Each message carries a `sender` object — `sender.isPatient` drives which side of the chat window the bubble appears on.

### Real-time strategy

This sample uses **polling** (`GET` every 4s) because it needs no extra infrastructure. For production, prefer Wizlo's **Kafka event stream**, which pushes provider replies the moment they are sent — see [Sample 4](../4-realtime-kafka).

## Running Locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in your Wizlo credentials
npm install
npm run dev                 # http://localhost:3062

# 2. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3072
```

## Project Structure

```
3-messaging/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── wizlo/          ← shared Wizlo API client (OAuth2 + fetch)
│       └── chats/
│           ├── chats.controller.ts   ← GET/POST /chats/:encounterId/messages
│           ├── chats.service.ts
│           ├── chats.module.ts
│           └── dto/
│               └── send-message.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx    ← chat window with polling + composer
        └── lib/
            └── api.ts
```

## Response Shapes

**`GET .../messages`**

```json
{
  "thread": { "id": "thread-123", "encounterId": "ES000001", "threadType": "medical", "status": "active" },
  "messages": [
    {
      "messageId": "1772530705808",
      "content": "When will my prescription be ready?",
      "sender": { "isPatient": true, "isCurrentUser": true, "isSystemUser": false, "fullName": "Jerry Jhones" },
      "sentAt": "2026-03-03T09:38:25.000Z",
      "deliveryStatus": "read",
      "attachments": []
    }
  ]
}
```

**`POST .../messages/patient`**

```json
{ "messageId": "1772530705808", "sentAt": "2026-03-03T09:38:25.000Z" }
```

## See Also

- [Chat Integration Guide](https://docs.wizlo.com/guides/chat-integration)
- [Get Thread Messages API reference](https://docs.wizlo.com/api-reference/apis/get-thread-messages)
- [Send Patient Message API reference](https://docs.wizlo.com/api-reference/apis/send-patient-message)
- [Sample 4 — Real-time via Kafka](../4-realtime-kafka)
