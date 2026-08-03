# 21 — Deposit-to-Hold & Pay-Later (design doc — NOT built)

> **Version:** 0.1.0 · **Status:** design only, deliberately unbuilt ·
> **Written:** 2026-08-02 · **Blocked on:** owner commercial terms (see
> [`OWNER-TODO.md`](../OWNER-TODO.md) "Pricing & packaging").
>
> Stage 2 of the ecosystem build ships everything around this (instant
> estimates, proposal microsite hardening, add-ons at acceptance). The money
> mechanics are specified here and implemented only after the owner sets the
> terms — building a deposit flow around guessed percentages would mean
> re-doing legal-adjacent copy and refund handling.

## 1. The problem

An accepted proposal is a handshake, not a commitment. Machines are physical
inventory and popular dates book out 6–8 weeks ahead (the scarcity is real —
it's in our public copy), yet nothing today converts "accepted" into a held
slot. The buyer can accept and go quiet; we can't safely turn away a second
enquiry for the same machine and dates. Marketplaces solved this years ago:
money down = date held, instantly, self-serve.

## 2. The design

### Deposit-to-hold

- On proposal acceptance, the microsite offers **"Hold your dates"**: pay a
  deposit now and the machine + date range is locked against your event.
- Quote lifecycle gains two states after `accepted`:
  `accepted → hold_pending (deposit invoice issued) → held (deposit paid)`.
  `held` is what ops and the pipeline treat as bookable-no-longer.
- The hold offer itself expires (proposed: 7 days after acceptance) so an
  unpaid "hold" can't silently block inventory. Expiry returns the quote to
  plain `accepted` and notifies the AE.
- Payment via a hosted checkout link (Stripe Checkout is the working
  assumption; `// INTEGRATION: Stripe` stub per handover rules). No card data
  ever touches the app.

### Pay-later (invoice terms)

- For recognised enterprises: accept + PO number → `held` without upfront
  payment, balance on net-30 invoice. Gated by an internal allowlist the AE
  controls (no self-serve credit decisions).

### What the customer sees

Acceptance screen, in order: (1) "You're in — here's what happens next",
(2) Hold-your-dates card with deposit amount and the one-line refund rule,
(3) pay-later link for those with terms. The deposit amount is computed from
the accepted fee, never re-negotiated on this screen.

## 3. Owner decisions required (blocking)

| Decision | Proposed default (for reaction, not assumption) |
|---|---|
| Deposit size | 25% of the accepted fee, min £2,500 |
| Refund rule | Full refund ≥6 weeks out; 50% ≥3 weeks; none inside 3 weeks |
| Hold-offer window | 7 days from acceptance |
| Pay-later gating | AE-managed allowlist, net-30, PO required |
| Payment rails | Stripe (new account) vs existing invoicing stack |

## 4. Implementation sketch (for the dev team, post-decision)

- **Schema:** `quotes.hold_status` (`none | pending | held | lapsed`),
  `quotes.deposit_pence`, `quotes.hold_expires_at`; no new table needed —
  the hold is an attribute of the quote, and the machine/date lock is
  enforced by the existing provisioning/pipeline reads filtering on `held`.
- **Actions:** `offerHold(quoteId)` (AE/internal), `startDepositCheckout
  (quoteId)` (customer, returns checkout URL), webhook
  `/api/webhooks/stripe` marking `held` on `checkout.session.completed`
  (HMAC-verified, mirrored in `docs/10-integrations.md`).
- **Expiry:** the existing daily cron sweep gains a `lapse_stale_holds` step.
- **Surfaces:** acceptance block on `/proposal/[id]`, hold state chip in the
  pipeline board and event provisioning, AE notification on `held`/`lapsed`.
- **Tests:** state-transition unit tests per branch, webhook signature tests,
  RLS unchanged (holds ride the quote row).

Effort once unblocked: ~1 focused day including tests and docs.
