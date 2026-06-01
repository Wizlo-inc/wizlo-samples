# Wizlo Forms — Iframe Embed

**Wizlo renders the entire form UI. Your app just provides the wrapper.**

In this pattern you embed Wizlo's pre-built form interface in an `<iframe>`. The user fills and submits the form entirely inside that iframe — Wizlo handles all the UI, validation, draft saving, PHI mapping, and submission storage. Your app only needs to know when the submission is complete (via a `postMessage` event).

---

## When to use this pattern

| ✅ Use iframe when… | ❌ Use programmatic instead when… |
|---|---|
| You want zero frontend work for the form itself | You need full UI/UX control |
| The form has complex features (file uploads, payments, IDV) | You need to pre-fill or transform data |
| You want Wizlo's built-in draft / resume support | You want your own branding on every input |
| You want automatic future updates to the form UI | You're building a native/mobile app |

---

## How it works

```
Step 1 — Patient
  Frontend: search or create a patient → get patient.id

Step 2 — Select Form
  Frontend: pick from GET /forms?status=published
  User clicks a form → backend calls POST /forms/attach

Step 3 — Embed
  POST /forms/attach  { formId }
  → Wizlo creates a UserFormInvitation
  → Returns: { formId, userFormInvitationId, embedUrl }

  embedUrl = "https://app.wizlo.com/form-submission?token=<bcrypt-hash>"

  Frontend renders:
    <iframe src={embedUrl} scrolling="no" />

  Parent page listens for postMessage events from the iframe:
    ┌─────────────────────────────────────────────────────────────────┐
    │  wizlo-form-resize     { type, height }                        │
    │    → Update iframe CSS height so content is never clipped       │
    │                                                                 │
    │  wizlo-form-scroll-top { type }                                │
    │    → Call iframe.scrollIntoView() on page transitions          │
    │                                                                 │
    │  wizlo-form-complete   { type }                                │
    │    → Show thank-you banner, redirect, or trigger downstream    │
    └─────────────────────────────────────────────────────────────────┘
```

---

## File structure

```
iframe/
├── README.md
├── backend/                   NestJS backend (port 3022)
│   ├── .env.example
│   └── src/
│       ├── main.ts            Entry point
│       ├── app.module.ts      Registers Patients, Forms modules
│       ├── wizlo/
│       │   └── wizlo.service.ts   OAuth2 token cache + request helper
│       ├── patients/
│       │   └── ...                GET /patients, POST /patients
│       └── forms/
│           ├── forms.controller.ts   GET /forms, GET /forms/:id/compatible, POST /forms/attach
│           └── forms.service.ts      getForms, checkIframeCompatible, attachForm (3-step M2M flow)
└── frontend/                  Next.js frontend (port 3023)
    └── src/
        ├── lib/api.ts         Fetch wrappers
        └── app/
            └── page.tsx       2-step picker + iframe with postMessage handling
```

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=3022
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_APP_URL=https://app-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
```

> `WIZLO_APP_URL` is the Wizlo **frontend** domain (where the form UI is served), not the API domain.
> The embed URL is built as `{WIZLO_APP_URL}/form-submission?token=...`.

```bash
npm install
npm run dev
# Backend: http://localhost:3022
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Frontend: http://localhost:3023
```

---

## API endpoints (backend)

```bash
# List published forms
GET /forms

# Check whether a form is ready for iframe embedding
# Response: { "compatible": bool, "status": "ready|needs_setup|missing_phi", "message": "..." }
GET /forms/:id/compatible

# Build the personalised iframe embed URL (3-step M2M flow internally)
# Request:  { "formId": "<uuid>", "patientId": "<uuid>" }
# Response: { "formId": "...", "embedUrl": "https://{WIZLO_APP_URL}/form-submission?token=...&sid=..." }
POST /forms/attach
```

### Compatibility states

| Status | Meaning | Fix |
|---|---|---|
| `ready` | Public invite exists — works immediately | — |
| `needs_setup` | PHI fields present but no public invite yet | Dashboard → Forms → Share → Get Public Link |
| `missing_phi` | Form lacks `phi_email` / `phi_first_name` / `phi_last_name` | Add fields in Wizlo form builder, republish |

---

## The postMessage API

Wizlo's iframe communicates with the parent window using `window.parent.postMessage`.
Register a listener in your parent page:

```typescript
window.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  const { type, height } = event.data;

  switch (type) {
    case 'wizlo-form-resize':
      // The form's content height changed — update your iframe height
      // so there's no inner scrollbar and no clipped content.
      iframe.style.height = height + 'px';
      break;

    case 'wizlo-form-scroll-top':
      // The form navigated to a new page — scroll the iframe into view.
      iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;

    case 'wizlo-form-complete':
      // The user finished and submitted the form.
      // Show a thank-you message, redirect, or trigger downstream logic.
      showThankYou();
      break;
  }
});
```

---

## The embed URL and token

`POST /forms/attach` returns an `embedUrl` in this format:

```
https://app.wizlo.com/form-submission?token=%242b%2412%24...
```

The token is a **bcrypt hash** (URL-encoded). This means:
- Each `attach` call produces a unique token
- Tokens cannot be enumerated or reversed
- It is safe to put the URL directly in `<iframe src>`
- The token identifies both the form and the specific invitation instance

**Do not** cache and reuse the same `embedUrl` for multiple users or sessions.
Call `POST /forms/attach` fresh for each new form session.

---

## Allowing the camera widget

Some forms use Vouched identity verification which requires camera access.
If your form includes IDV, add the `allow` attribute to the iframe:

```html
<iframe
  src={embedUrl}
  allow="camera; microphone"
  scrolling="no"
/>
```

---

## Screenshots

### Step 1 — Find or Create Patient

Search for an existing patient by email or create a new one. Every form embed is linked to a patient record.

![Iframe forms — Step 1 patient search](../../screenshots/iframe-1.png)

### Step 3 — Wizlo Form Embedded and Loaded

After selecting a form, the backend calls `POST /forms/attach`, builds the embed URL, and the Wizlo form renders inside the `<iframe>`. The progress bar and "Next Page" button are fully managed by Wizlo.

![Iframe forms — Step 3 form loaded](../../screenshots/iframe-3.png)

### Step 3 — Form Being Filled

The user progresses through the form pages. The iframe height updates dynamically via `wizlo-form-resize` postMessage events so content is never clipped.

![Iframe forms — Step 3 form in progress](../../screenshots/iframe-5.png)

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: 3022) |
| `WIZLO_BASE_URL` | Yes | Wizlo API base URL |
| `WIZLO_CLIENT_ID` | Yes | Your Wizlo M2M client ID |
| `WIZLO_CLIENT_SECRET` | Yes | Your Wizlo M2M client secret |
