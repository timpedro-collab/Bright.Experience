# Playwright E2E journeys

Ten browser tests that drive the top customer + internal flows in a
real Next.js production build. Spec files live next to this README;
shared helpers live under `fixtures/`.

## Running locally

```bash
# One-time
npx playwright install --with-deps chromium

# Run all journeys
npm run test:e2e

# Run a single spec, headed, with the inspector
npx playwright test e2e/customer-asset-upload.spec.ts --debug
```

Playwright will `npm run build && npm start` the app automatically.
The webServer is started with `TEST_MODE=1`, which enables the
`/api/test/login` and `/api/test/reset` endpoints used by the fixtures.

## The journeys

| File                                       | What it proves                                                 |
| ------------------------------------------ | -------------------------------------------------------------- |
| `customer-asset-upload.spec.ts`            | Customer can upload an asset → "pending review" pill renders.  |
| `customer-approval.spec.ts`                | Customer can approve a proof → notification + Pipedrive fire.  |
| `customer-briefing.spec.ts`                | Customer can submit the briefing form.                          |
| `internal-asset-review-approve.spec.ts`    | Internal can approve a customer asset.                          |
| `internal-asset-review-revision.spec.ts`   | Internal can request a revision with feedback.                  |
| `internal-dashboard-workhub.spec.ts`       | Six work-hub tiles render with counts + correct links.          |
| `internal-inbox-filters.spec.ts`           | Inbox filter changes write to and persist in the URL.           |
| `public-quiz-to-proposal.spec.ts`          | Quiz → proposal intake → AE sees the new row.                   |
| `public-quiz-to-booking.spec.ts` *(P1)*    | Guest walks Book Now → configure → checkout → confirmation.     |
| `public-partner-attribution.spec.ts` *(P1)*| `/p/[code]` sets `bb_partner` cookie + co-branded hero.         |
| `public-report-share.spec.ts` *(P1)*       | Published share-token renders; unknown token 404s.              |
| `proposal-accept.spec.ts`                  | Guest accepts a proposal link → AE gets notified.               |
| `rbac-blocks.spec.ts`                      | Non-internal users cannot reach `/admin/*`.                     |

The specs marked *(P1)* are entirely guest-only and do not require the
`/api/test/login` or `/api/test/reset` endpoints — they only need a
running webserver with the standard seed data applied.

## Authoring conventions

- Each spec calls `resetDatabase()` in `beforeEach` so journeys are
  independent.
- Personas are managed via the `loginAs(persona)` fixture, which uses
  the `/api/test/login` endpoint instead of running through Supabase
  Auth UI.
- Prefer role-based selectors (`getByRole("button", { name: ... })`)
  over CSS selectors so refactors don't break tests.
- Keep journeys short — one user goal per file.
