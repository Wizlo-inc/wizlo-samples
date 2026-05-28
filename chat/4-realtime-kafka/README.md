# Sample 4 — Real-time Chat via Kafka

Demonstrates how to receive **real-time** chat events from Wizlo. The REST API ([Samples 1–3](../3-messaging)) is request/response only — it cannot tell you when a *provider* replies. Wizlo publishes those replies to a per-tenant **Kafka topic**, and this sample runs a long-lived consumer that listens for them.

> **Why Kafka and not the webhook?** The [communication-message webhook](../../webhooks/6-communication-webhook) is a fine push mechanism too. Kafka is the choice when you want an ordered, replayable, offset-tracked stream you consume from your own server. Both deliver the same `chat-message` content.

## What it does

- Connects to your tenant's Kafka topic over **TLS + SASL/PLAIN**.
- Subscribes with `fromBeginning: false` (only new messages).
- Routes by the `x-message-type` header and ignores unknown types.
- Buffers the most recent events in memory and exposes them over HTTP so the demo UI can display the live feed.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events` | Consumer status + recent `chat-message` events |
| `DELETE` | `/events` | Clear the in-memory buffer |

## Connection details (request from Wizlo)

| Credential | Description |
|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | Broker address — `<namespace>.servicebus.windows.net:9093` |
| `KAFKA_TOPIC` | Tenant topic — e.g. `tenant-<tenantId>-messages` |
| `KAFKA_CONSUMER_GROUP` | Consumer group — e.g. `tenant-<tenantId>-consumer` |
| `KAFKA_SASL_USERNAME` | Always the literal `$ConnectionString` |
| `KAFKA_SASL_PASSWORD` | Full Azure Service Bus connection string |

Connection protocol: Kafka over TLS, port `9093`, SASL mechanism `PLAIN`, `ssl: true`.

## Running Locally

```bash
# 1. Backend (the Kafka consumer)
cd backend
cp .env.example .env        # fill in the KAFKA_* values from Wizlo
npm install
npm run dev                 # http://localhost:3063

# 2. Frontend (live event feed)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3073
```

The backend boots even without Kafka configured — it logs a warning and serves an empty event list, so you can wire up the UI first.

## Project Structure

```
4-realtime-kafka/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       └── events/
│           ├── kafka-consumer.service.ts  ← long-lived kafkajs consumer
│           ├── events.controller.ts       ← GET/DELETE /events
│           └── events.module.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx    ← polls /events, renders the live feed
        └── lib/
            └── api.ts
```

## Kafka message structure

**Headers:** `content-type: application/json`, `x-tenant-id: <uuid>`, `x-message-type: chat-message`
**Key:** thread ID or encounter ID (useful for partitioned consumption)
**Value (JSON):**

```json
{
  "messageId": "msg-uuid-abc123",
  "content": "Hello! How can I help you today?",
  "sender": { "displayName": "Dr. John Smith", "isPatient": false, "avatarUrl": null },
  "sentAt": "2026-02-26T07:36:29.873Z",
  "deliveryStatus": "sent",
  "attachments": []
}
```

## Production notes

This sample buffers events in memory for the demo. In a real integration your consumer should be a **long-running background service** that pushes each event onward (WebSocket/SSE to the patient UI, or a DB write) and handles graceful shutdown so offsets commit cleanly. You consume only — clients cannot publish to Kafka or manage topics.

## See Also

- [Chat Integration Guide → Real-Time Events via Kafka](https://docs.wizlo.com/guides/chat-integration)
- [Sample 3 — Chat Messaging (REST + polling)](../3-messaging)
- [Communication Message Webhook sample](../../webhooks/6-communication-webhook)
