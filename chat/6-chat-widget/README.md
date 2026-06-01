# Sample 6 — Drop-in Chat Widget (`@wizlo/chat-widget`)

Demonstrates the **fastest** way to add chat: mount Wizlo's prebuilt React widget instead of building any UI. This is a different integration model from Samples 1–5 (which call the headless REST API and render their own UI).

| | This sample (widget) | Samples 1–5 (headless REST) |
|---|---|---|
| UI | Prebuilt & themeable (`<ChatWidget>`) | You build it |
| Wizlo API | `/chats/*` (order-based) | `/chats-v2/*` (encounter-based) |
| Auth token | **User** token via `/oauth/user-token` | **M2M** token via `/oauth/token` |
| Real-time | Azure Communication Services, in the browser | Kafka / webhook / polling |
| You write | A token endpoint + `<ChatWidget/>` | Backend proxy + full frontend |

## How it works

```
1. Browser → POST /auth/token { email }        (this sample's backend)
2. Backend → POST /oauth/user-token            (client_id + client_secret + user_email)
3. Backend → returns a USER access token + the Wizlo base URL
4. Browser mounts <ChatWidget initParams={{ baseUrl, authToken, metaData:{orderNo} }} />
5. The widget then calls Wizlo directly:
     POST /chats/order-thread/patient  → create/return the thread for orderNo
     POST /chats/token                 → ACS token for the live connection
     GET/POST /chats/:threadId/messages…  + opens an ACS realtime connection
```

You only write **two things**: the `/auth/token` backend endpoint (so `client_secret` never reaches the browser) and the `<ChatWidget>` mount. Everything else — thread creation, message history, sending, live updates, theming — is inside the package.

## Running Locally

```bash
# 1. Token backend
cd backend
cp .env.example .env        # fill in WIZLO_CLIENT_ID / WIZLO_CLIENT_SECRET
npm install
npm run dev                 # http://localhost:3065

# 2. Frontend
cd frontend
cp .env.local.example .env.local
npm install                 # pulls @wizlo/chat-widget from the registry
npm run dev                 # http://localhost:3075
```

> **Registry access:** the frontend depends on `@wizlo/chat-widget` (`^1.0.7`). If it is published to a private registry, configure your `.npmrc` / auth token before `npm install`, exactly as the reference app `wizlo-app/package-test/frontend` does.

> **CORS — local dev:** The widget calls the Wizlo API **directly from the browser** (step 5 above). In non-production environments the API's CORS policy must whitelist your frontend origin (e.g. `http://localhost:3075`). If you see a `400 The origin '...' is not allowed` preflight error, contact the Wizlo team to add your local origin to the UAT allowed-origins list. This is not needed in production because your real domain will already be registered.

## `<ChatWidget>` props

| Prop | Type | Required | Description |
|------|------|:--------:|-------------|
| `initParams` | `{ baseUrl, authToken, metaData: { orderNo } }` | ✓ | Wizlo base URL, the user token, and the order to chat about |
| `primaryColor` | `string` | ✓ | Theme color (hex) |
| `secondaryColor` | `string` | ✓ | Secondary theme color (hex) |
| `menuItems` | `MenuItemConfig[]` | ✓ | Dropdown items `{ label, action, icon? }` |
| `showMenu` | `boolean` | ✓ | Toggle the dropdown menu |

## Project Structure

```
6-chat-widget/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       └── auth/
│           ├── auth.controller.ts   ← POST /auth/token
│           ├── auth.service.ts       ← calls Wizlo POST /oauth/user-token
│           ├── auth.module.ts
│           └── dto/token-request.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx            ← config form → token → mounts the widget
        ├── components/
        │   └── ChatPanel.tsx        ← <ChatWidget> (loaded client-side only)
        └── lib/
            └── api.ts               ← getUserToken()
```

> **Next.js note:** the widget is loaded via `next/dynamic` with `ssr: false`, because it manages its own Redux store and opens a browser-only ACS connection. In a Vite/CRA app you can import `<ChatWidget>` directly (see `wizlo-app/package-test`).

## See Also

- [Chat Integration Guide](https://docs.wizlo.com/guides/chat-integration)
- `@wizlo/chat-widget` package README (in `wizlo-app/packages/@wizlo-chat-widget`)
- Reference consumer app: `wizlo-app/package-test`
- [Sample 3 — build-your-own UI over REST](../3-messaging)
