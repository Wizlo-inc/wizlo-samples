# Wizlo Forms — With Wizlo

Two sample apps showing how to integrate Wizlo forms into your product.

| Sample | Pattern | Who renders the UI? | Backend port | Frontend port |
|---|---|---|---|---|
| [`programmatic/`](./programmatic/) | Your app collects answers → sends JSON to Wizlo | **You** | 3020 | 3021 |
| [`iframe/`](./iframe/) | Wizlo's pre-built UI embedded in an `<iframe>` | **Wizlo** | 3022 | 3023 |

## Quick comparison

```
Programmatic                          Iframe
────────────────────────────────────  ────────────────────────────────────
GET  /forms/:id/schema                GET  /forms
  ↓ fieldSchema[] + payloadTemplate     ↓ form list
Render your own <input> fields        POST /forms/attach
  ↓ user fills in                       ↓ embedUrl
POST /forms/programmatic/submit       <iframe src={embedUrl} />
  ↓ { submissionId, patientUpdated }    ↓ postMessage: wizlo-form-complete
```

See each subfolder's `README.md` for full setup instructions and API reference.

---

## Screenshots

### Programmatic Forms — submission result

![Programmatic form submitted successfully](../screenshots/programmatic-form.png)

### Iframe Forms — Step 1: Find or Create Patient

![Iframe forms — patient search](../screenshots/iframe-1.png)

### Iframe Forms — Step 3: Wizlo form embedded and loaded

![Iframe forms — form loaded inside iframe](../screenshots/iframe-3.png)

### Iframe Forms — Step 3: Form in progress

![Iframe forms — form being filled](../screenshots/iframe-5.png)
