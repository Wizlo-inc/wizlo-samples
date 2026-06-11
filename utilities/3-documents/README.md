# Utilities · 3 — Documents

Attach a document to a patient by **URL**: hand Wizlo a public file URL and it
fetches the file server-side, stores it, and links it to the patient's profile.
Handy for pulling signed PDFs from external intake / lab providers without
streaming the bytes through your own backend.

## APIs Covered

| Method | Sample endpoint | Proxies (Wizlo) | Auth |
|--------|-----------------|------------------|------|
| `POST` | `/documents/upload-from-url` | `POST /clients-documents/:id/upload-url/:documentType` | M2M |

The sample endpoint takes a flat body and maps it onto the Wizlo path + body:

```jsonc
// POST /documents/upload-from-url  (this sample)
{
  "patientId":    "a8912dbe-137c-4d9e-8785-84bd1ef298f3",  // → path :id
  "documentType": "intake-forms",                          // → path :documentType
  "url":          "https://example.com/intake.pdf",        // → body.url
  "fileName":     "intake_form_2025.pdf"                   // → body.fileName (optional)
}
```

## Authentication

Uses the tenant **M2M admin token** from `POST /oauth/token`
(grant `client_credentials`) — see `WizloService.request`.

> The Wizlo route is protected by its JWT auth guard, but the admin token issued
> by `/oauth/token` is itself a bearer JWT that satisfies it — exactly like the
> location endpoints. No end-user login is needed for this server-to-server call.

## Document types

`documentType` is a path segment that controls which MIME types Wizlo accepts:

`intake-forms`, `lab-results`, `lab-reports`, `documents`, `photos`,
`government-ids`, `identity-documents`, `medical-records`, `imaging-scans`,
`prescriptions-medication`, `insurance-billing`, `legal-consent`.

Most types accept PDF / DOCX / images; `photos` is image-only; `government-ids`
accepts PNG / JPEG / PDF. A type/MIME mismatch returns `400`.

## Response

```json
{
  "message": "Document uploaded successfully",
  "documentId": "c1814499-8db8-a017-9b58-952679d6d3bd",
  "fileUrl": "https://…/documents/…?sv=…&sig=…",
  "userDocument": {
    "id": "c1814499-8db8-a017-9b58-952679d6d3bd",
    "clientId": "a8912dbe-137c-4d9e-8785-84bd1ef298f3",
    "storageProvider": "azure-blob",
    "contentType": "application/pdf",
    "sizeBytes": 88226,
    "docType": "intake-forms",
    "fileName": "intake_form_2025.pdf",
    "createdAt": "2025-12-05T10:36:19.507Z"
  }
}
```

`fileUrl` is a short-lived signed (SAS) URL for the stored file.

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3082

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3092
```

The UI has a **Use sample PDF** button that fills in a public test PDF so you can
try the flow with just a valid `patientId`.
