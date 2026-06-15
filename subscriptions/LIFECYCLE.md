# Subscription + Refill Lifecycle

This document explains the **complete runtime lifecycle** of a Wizlo subscription — from enrollment through refills, reassessment, payment recovery, and end states. It bridges the five numbered subscription samples in this folder with the [refills sample](../refills/README.md), and explains what happens **between API calls** via the daily automation crons.

For the published customer-facing version, see the [Subscription & Refill Lifecycle](https://docs.wizlo.com/guides/subscription-refill-lifecycle) guide.

---

## TL;DR

After enrollment and first payment, three daily cron jobs handle everything automatically:

```
09:00 UTC — Reminders cron:
   └── Unpaid cycle order exists → send payment-link reminder to patient

10:00 UTC — Payment retry cron:
   └── nextPaymentRetryDate <= now → re-attempt autopay charge

11:00 UTC — Fulfillment cron:
   For each subscription where nextFulfillmentDate <= now:
      ├── Refills remaining + Rx valid       → create a REFILL order
      ├── Refills exhausted, within duration → create a NEW ENCOUNTER
      ├── Refills exhausted, duration exceeded → EXPIRE the subscription
      └── Rx expiring in 10 / 7 / 3 days     → send REASSESSMENT form

   Then for the resulting order:
      ├── autopayEnabled        → charge saved card
      └── autopay disabled/fail → send payment link (3-day expiry)
```

The patient does nothing unless their prescription needs a reassessment, in which case they fill out a form.

---

## Subscription States

The `ClientSubscriptionStatus` enum has **10 states** (see `api/prisma/clinic/schema.prisma`):

| State | Meaning | Entered from | Exits to |
| :--- | :--- | :--- | :--- |
| `PENDING` | Created, awaiting first payment | `POST /tenants/client-subscriptions` | `mark-paid` → `ACTIVE` (or intermediate) |
| `PENDING_LAB_SCHEDULING` | First payment cleared; lab visit must be scheduled | mark-paid when plan requires labs | Patient schedules lab |
| `PENDING_LAB_RESULTS` | Lab visit booked; awaiting results | Patient schedules lab | Results received |
| `AWAITING_APPOINTMENT` | Awaiting initial provider appointment | mark-paid when plan requires appointment | Appointment completed |
| `ACTIVE` | Healthy, in regular fulfillment cycle | All onboarding done | Pause / cancel / expire / payment failure / reassessment |
| `PAUSED` | Manually paused | `PATCH /:id/pause` | `PATCH /:id/resume` |
| `REASSESSMENT_REQUIRED` | Prescription expiring; needs new clinical input | Fulfillment cron when Rx near expiry | Patient submits reassessment form |
| `PAYMENT_FAILED` | Autopay failed and all retries exhausted | After `maxPaymentRetries` failed retries | `retry-payment` / `resend-payment-link` / update payment method |
| `CANCELLED` | Manually cancelled | `PATCH /:id/cancel` | `PATCH /:id/reassign` (revive) |
| `EXPIRED` | Duration limit reached (terminal) | Cron detects `effectiveDate + duration < now` AND no refills remaining | — |

---

## Day-by-Day Timeline (30-day cycle example)

| Day | What happens | Sample to study |
| :--- | :--- | :--- |
| **0** | Patient enrolls → `PENDING`. Initial order is created automatically. `nextFulfillmentDate = effectiveDate + 30`. | [`2-enrollment/`](./2-enrollment/) |
| 0 | Patient completes Gr4vy checkout → `mark-paid` → `ACTIVE` (or intermediate). `totalCyclesCompleted = 1`. `lastPaymentDate = now`. Initial encounter created and linked. Rx submitted to pharmacy. | [`2-enrollment/`](./2-enrollment/) |
| 20–27 | Fulfillment cron detects prescription expiring in 10 / 7 / 3 days → sends reassessment form (Path A — only if plan has `reassessmentFormId`). | docs/guides reference |
| **30** | Fulfillment cron fires (11:00 UTC). `nextFulfillmentDate <= now` → process subscription. | [Decision tree](#fulfillment-decision-tree) |
| 30 | → **Refills available + Rx valid** → `RefillOrder` row created linking `Order ↔ EncounterTreatment`. | [`../refills/`](../refills/) |
| 30 | → **Refills exhausted, duration not exceeded** → new encounter created automatically. | — |
| 30 | → **Refills exhausted, duration exceeded** → status moves to `EXPIRED`. | — |
| 30 | `autopayEnabled = true` → charge saved card. On success: `nextFulfillmentDate += cycle`, `totalCyclesCompleted++`, `consecutiveFailures = 0`. | [`4-autopay/`](./4-autopay/) |
| 30 | `autopayEnabled = false` → payment link emailed (expires in 3 days). | [`2-enrollment/`](./2-enrollment/) |
| 33 | If Day-30 autopay failed → payment retry cron (10:00 UTC) attempts charge. Up to `maxPaymentRetries` (default `3`) at `retryIntervalDays` (default `3`) intervals. | [`4-autopay/`](./4-autopay/) |
| 33+ | If max retries exhausted → `PAYMENT_FAILED`. Staff can manually retry via `POST /:id/retry-payment` or resend payment link. | [`4-autopay/`](./4-autopay/) |
| 60, 90, … | Cycle repeats. Refills consumed one per cycle until exhausted, then a new encounter is auto-created. | — |

---

## Fulfillment Decision Tree

The daily fulfillment cron (`subscription-fulfillment-cron.service.ts`) runs this logic for every subscription due to renew:

```
1. Existing unpaid order for this cycle?  → REUSE it
2. Plan kind = SERVICE?                    → create a service order
3. Plan kind = PRODUCT, no encounter required? → create a product order
4. Plan kind = PRODUCT, encounter required:
   a. No prior subscription encounter      → CREATE NEW ENCOUNTER
   b. Latest encounter is PENDING          → SKIP (wait for it to clear)
   c. Latest encounter TERMINAL (rejected/cancelled/expired) → CREATE NEW ENCOUNTER
   d. Latest encounter COMPLETED:
      i.   PrescriptionValidity expired    → CREATE NEW ENCOUNTER
      ii.  No indicated treatment          → CREATE NEW ENCOUNTER
      iii. Refills remaining               → CREATE REFILL ORDER
      iv.  Refills exhausted:
           - subscription duration exceeded → EXPIRE subscription
           - duration not exceeded          → CREATE NEW ENCOUNTER
```

The key insight: a healthy subscription produces **`REFILL` orders cycle after cycle** until the original prescription runs out of refills. Only then does a **new encounter** get created — putting the prescription back in front of a provider for re-evaluation.

---

## How Refills Work Inside a Subscription

A subscription does **not** create a fresh prescription each cycle. It rides the original encounter's prescription until refills are exhausted.

### Refill eligibility (per treatment)

Computed by `RefillService.calculateRefillEligibility()`:

```
canRefillNow = hasRefillsRemaining
             AND isDaysSupplyElapsed
             AND isPrescriptionValid

hasRefillsRemaining  = refillsUsed < totalRefillsAllowed
isDaysSupplyElapsed  = today >= lastRefillDate + daysSupply
isPrescriptionValid  = today < prescriptionExpiryDate  (default: encounter date + 1 year)
```

If `canRefillNow = false`, the `reason` field tells you which check failed:

| `reason` | Meaning |
| :--- | :--- |
| `null` | Eligible to refill now |
| `next_refill_in_x_days` | Days-of-supply window has not elapsed |
| `no_refills_remaining` | Prescription is exhausted — a new encounter is needed |

### Order types

Every order carries an `orderType`:

| `orderType` | Source |
| :--- | :--- |
| `NORMAL` | Initial prescription order from an encounter |
| `REFILL` | Refill of an existing prescription — links to `EncounterTreatment` via `RefillOrder` |

A `RefillOrder` row freezes `maxRefillsAllowed` and `daysSupply` snapshots at creation time, so audit history is preserved even if the original `ProductRx` changes.

For the standalone refill API (staff-initiated and patient-initiated), see [`../refills/`](../refills/) and [`../refills/edgecases/`](../refills/edgecases/).

---

## Reassessment

When the prescription is approaching expiry or refills are exhausted, the subscription needs new clinical input. There are two paths.

### Path A — Plan has `reassessmentFormId` configured (fully automated)

| Days before Rx expiry | Action |
| :--- | :--- |
| 10 | Reassessment form emailed to patient |
| 7 | Reminder sent if not yet submitted |
| 3 | Final reminder sent if not yet submitted |
| Submission | Form auto-creates a new encounter → provider reviews → on approval, subscription continues with a fresh prescription |

Constants (`subscription-reassessment` module):

```
REASSESSMENT_FORM_SEND_DAYS_BEFORE_EXPIRY = [10, 7, 3]
REASSESSMENT_FORM_EXPIRY_DAYS             = 14
REASSESSMENT_GRACE_PERIOD_DAYS            = 3
```

If the cron is down during a send window, it catches up on the next run — the subscription does not silently stall.

### Path B — No `reassessmentFormId` configured (legacy, manual)

Subscription moves to `REASSESSMENT_REQUIRED`. A staff member must:

1. Filter `GET /tenants/client-subscriptions?status=REASSESSMENT_REQUIRED` for blocked subscriptions
2. Call `POST /tenants/client-subscriptions/:id/send-reassessment-form` manually
3. Track submission via `GET /tenants/client-subscriptions/:id/reassessment-forms`
4. Manually re-enroll once the provider has prescribed

**Recommendation:** Configure `reassessmentFormId` on every plan — Path A eliminates the manual step entirely.

### Patient grace period

After the reassessment form is sent, the patient has `REASSESSMENT_FORM_EXPIRY_DAYS` (14) + `REASSESSMENT_GRACE_PERIOD_DAYS` (3) = **17 days** to submit. Past that, the subscription remains blocked in `REASSESSMENT_REQUIRED` until staff intervention.

---

## Pause / Resume / Cancel / Delay

Available from both staff endpoints ([`3-lifecycle-management/`](./3-lifecycle-management/)) and patient endpoints ([`5-patient-portal/`](./5-patient-portal/)).

| Action | Allowed from | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Pause** | `ACTIVE` | `PAUSED` | Blocked if within `pauseCutoffDays` of next fulfillment. Optional `pausedUntilDate` (auto-resume not yet active — manual resume required today) |
| **Resume** | `PAUSED` | `ACTIVE` | Immediate |
| **Delay** | `ACTIVE`, `PAUSED` | unchanged | Moves `nextFulfillmentDate` forward. New date must be later than current value |
| **Cancel** | any non-`EXPIRED` | `CANCELLED` | The **patient** endpoint requires a reason (stored as `cancellationReason: { reason, description }`); the **staff/admin** endpoint takes no body and cancels without recording a reason |
| **Reassign** | `CANCELLED` | `ACTIVE` | Resets `nextFulfillmentDate = now`, clears `consecutiveFailures` |

---

## Autopay & Payment Failure Recovery

Once the first payment clears via `mark-paid`, autopay is enabled by default and stores the `paymentMethodId` from the Gr4vy session.

### Autopay flow (per cycle)

1. Fulfillment cron creates the cycle's order.
2. `attemptAutopay()` charges the saved card.
3. **Success** → order marked paid, `nextFulfillmentDate += cycle`, `totalCyclesCompleted++`, `consecutiveFailures = 0`, Rx submitted.
4. **Failure** → `consecutiveFailures++`, `nextPaymentRetryDate = now + retryIntervalDays`, status stays `ACTIVE` (still recoverable).

### Retry cron

`subscription-payment-retry-cron.service.ts` runs daily at **10:00 UTC**. For each subscription where `nextPaymentRetryDate <= now`:

- Re-attempt the charge.
- On success: restore to `ACTIVE` cycle, reset counters.
- On failure: increment `consecutiveFailures`, schedule next retry.
- After `maxPaymentRetries` (default `3`) → status moves to `PAYMENT_FAILED`. No more automated retries — staff must manually retry or resend payment link.

### Manual recovery options

| Endpoint | Purpose |
| :--- | :--- |
| `POST /tenants/client-subscriptions/:id/retry-payment` | Immediately charge the saved card again |
| `POST /tenants/client-subscriptions/:id/resend-payment-link` | Email a fresh Gr4vy payment link to the patient |
| `PATCH /tenants/client-subscriptions/:id/autopay/payment-method` | Swap to a different saved card before retrying |

See [`4-autopay/`](./4-autopay/) for working samples.

---

## Duration Limits & Renewals

Two independent fields govern subscription longevity:

| Field | Lives on | Meaning |
| :--- | :--- | :--- |
| `duration` (months) | ClientSubscription | When `effectiveDate + duration <= now` AND refills are exhausted, the next cron pass moves it to `EXPIRED`. `null` means infinite. |
| `maxRenewal` | SubscriptionPlan | Informational cap on total renewal cycles. **Does not auto-expire the subscription** — it's tracked via `totalRenewalsUsed`, but expiry is determined by `duration` only. |

A duration limit only triggers expiry **when combined with exhausted refills** — an active subscription with refills remaining keeps cycling even if its duration window has passed. The platform finishes the current Rx before terminating.

---

## Where the Samples Fit

Each sample folder demonstrates one phase of the lifecycle described above:

| Phase | Sample | Demonstrates |
| :--- | :--- | :--- |
| Plan setup | [`1-plan-management/`](./1-plan-management/) | Create/update/activate/delete subscription plans |
| Day 0 — enrollment + first payment | [`2-enrollment/`](./2-enrollment/) | `POST /client-subscriptions` → checkout token → `mark-paid` |
| Day 0+ — pause, resume, cancel, delay, reassign | [`3-lifecycle-management/`](./3-lifecycle-management/) | All staff-facing state transitions |
| Day 30+ — autopay & retry | [`4-autopay/`](./4-autopay/) | Configure autopay, swap card, manual retry on `PAYMENT_FAILED` |
| Patient self-service | [`5-patient-portal/`](./5-patient-portal/) | Patient-scoped list/view/pause/resume/cancel/delay |
| Refill cycles (cron output) | [`../refills/`](../refills/) | What gets generated when the fulfillment cron creates a `REFILL` order — eligibility, mark-paid, submit-rx |
| Refill failure modes | [`../refills/edgecases/`](../refills/edgecases/) | `no_refills_remaining`, `bypassDaysOfSupply` staff override |

The **automated cron logic itself is server-side** — there's no client sample for it because it isn't a client-callable endpoint. But understanding what the cron does is essential for integrating correctly: every state transition the cron triggers is observable via `GET /:id`, `GET /:id/orders`, `GET /:id/transactions`, and `GET /:id/timeline`.

---

## Cron Schedule Reference

| Cron | Schedule | File | What it does |
| :--- | :--- | :--- | :--- |
| Reminders | `0 9 * * *` (09:00 UTC daily) | `subscription-reminder-cron.service.ts` | Sends payment-link reminders for unpaid cycles |
| Payment retry | `0 10 * * *` (10:00 UTC daily) | `subscription-payment-retry-cron.service.ts` | Retries failed autopay charges until `maxPaymentRetries` |
| Fulfillment | `0 11 * * *` (11:00 UTC daily) | `subscription-fulfillment-cron.service.ts` | Creates refill / encounter orders; charges autopay; sends payment links |

---

## Key Fields on `ClientSubscription`

The fields you'll inspect most often when debugging a subscription's state:

| Field | What it tells you |
| :--- | :--- |
| `status` | Current state from the enum above |
| `nextFulfillmentDate` | When the next cron pass will attempt to process this subscription |
| `effectiveDate` | Start date — used for duration calculations |
| `duration` | Months until expiry (`null` = infinite) |
| `totalCyclesCompleted` | How many billing/fulfillment cycles have actually paid |
| `totalRenewalsUsed` | Cycle counter checked against `maxRenewal` |
| `autopayEnabled` | If `true`, cron charges automatically; otherwise sends payment link |
| `autopayPaymentMethodId` | Saved Gr4vy payment method UUID |
| `consecutiveFailures` | Resets to `0` on every successful payment |
| `maxPaymentRetries` | Default `3` |
| `retryIntervalDays` | Default `3` |
| `nextPaymentRetryDate` | Set when a charge fails; consumed by retry cron |
| `lastPaymentStatus` / `lastPaymentDate` | Most recent payment outcome |
| `pausedAt` / `pausedUntilDate` | Pause metadata |
| `cancelledAt` / `cancellationReason` | Cancel metadata |
| `endedAt` | Set when subscription terminates (`CANCELLED` or `EXPIRED`) |
| `enrolledPlanPrice` / `enrolledFirstPurchaseDiscount` | Price snapshots at enrollment — frozen so later plan changes don't affect this subscription |

---

## Debugging Checklist

When a subscription isn't doing what you expect:

1. **`GET /:id`** — check `status`, `nextFulfillmentDate`, `autopayEnabled`, `consecutiveFailures`.
2. **`GET /:id/timeline`** — chronological event log: state transitions, payments, encounters.
3. **`GET /:id/orders`** — every order created across cycles, with `orderType` (`NORMAL` vs `REFILL`) and payment status.
4. **`GET /:id/transactions`** — payment-level history, including failed attempts.
5. **`GET /tenants/refills/staff/encounter/:encounterId/treatments`** — per-treatment refill eligibility, including the `reason` why a refill couldn't be created.
6. If status is `REASSESSMENT_REQUIRED` → check whether the plan has `reassessmentFormId`; if not, you're on Path B and need to manually send the form.
7. If status is `PAYMENT_FAILED` → `consecutiveFailures` has exceeded `maxPaymentRetries`. Use `retry-payment` or `resend-payment-link`.
8. If status is `EXPIRED` and you expected another cycle → check `effectiveDate + duration` against `now`, AND check that refills are exhausted on the latest encounter. Both conditions must be true for expiry.

---

## Related Documentation

- [Subscription & Refill Lifecycle (published docs)](https://docs.wizlo.com/guides/subscription-refill-lifecycle)
- [Refills API guide (published docs)](https://docs.wizlo.com/guides/refills)
- [Subscription API guide (published docs)](https://docs.wizlo.com/guides/subscription-api-guide)
- [`./README.md`](./README.md) — index of the 5 subscription samples
- [`../refills/README.md`](../refills/README.md) — standalone refill happy-path sample
- [`../refills/edgecases/README.md`](../refills/edgecases/README.md) — refill failure modes and overrides
