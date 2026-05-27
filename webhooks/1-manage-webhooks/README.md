# Manage Webhooks

A sample app to **list, create, update, and delete** webhook configurations on your Wizlo tenant using the `/tenant/webhooks` API.

## What it does

This sample provides a simple UI to manage all webhook registrations for your tenant — no need to use the API directly. You can create webhooks for any module/event combination, update their URLs or secrets, toggle them on/off, and delete them.

## Ports

| Service  | Port |
|----------|------|
| Backend  | 3040 |
| Frontend | 3050 |

## Setup

**1. Create the `.env` file in `backend/`:**
```
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
PORT=3040
```

**2. Install and run the backend:**
```bash
cd backend
npm install
npm run dev
```

**3. Install and run the frontend:**
```bash
cd frontend
npm install
npm run dev
```

**4. Start ngrok:**
```bash
ngrok http 3040
```

## Steps to test

1. Open `http://localhost:3050` in your browser
2. View all existing webhook configurations for your tenant
3. Create a new webhook — choose a module (e.g. `encounters`), event (e.g. `updated`), and paste a URL
4. Edit an existing webhook to change the URL or toggle it active/inactive
5. Delete a webhook that is no longer needed

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks` | List all webhooks |
| POST | `/webhooks` | Create a webhook |
| GET | `/webhooks/:id` | Get a webhook by ID |
| PATCH | `/webhooks/:id` | Update a webhook |
| DELETE | `/webhooks/:id` | Delete a webhook |
