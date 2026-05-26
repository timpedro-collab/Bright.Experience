# Stubs to replace before launch

Every entry here is a clearly-labelled placeholder that ships behind a real surface so the platform compiles, renders, and tests cleanly today — but **must be swapped for the real thing** before we hand the keys to customers.

Each row tells you:
- **What** is currently stubbed
- **Where** in the codebase the stub lives (grep-able)
- **Why** it was stubbed (so the next engineer doesn't second-guess us)
- **Phase / Owner** that will own the replacement

---

## Phase 0 — Foundations (this phase)

| What | Where | Why stubbed | Replace in |
| --- | --- | --- | --- |
| Stripe API keys / webhook secret | `.env.example` placeholders; checkout flow uses fake intent IDs prefixed `pi_stub_` | Real Stripe account / Connect setup is a business onboarding decision, not a code decision | Phase 1 (booking flow) once the live Stripe account is provisioned |
| Customer / partner logos in seed data | `supabase/seed.sql` — references monogram SVGs at `/public/brand/logos/*.svg` | We don't have rights to real customer logos until contracts are signed | Phase 1 (catalog) + Phase 5 (partner portal) — replace with the signed-off brand kit |
| Legal copy on `/privacy`, `/terms` | `src/app/(public)/privacy/page.tsx`, `src/app/(public)/terms/page.tsx` | Lorem-shaped placeholder; needs legal review | Phase 1 (legal pages task) — copy delivered by Bright legal counsel |
| Virus scan on uploaded assets | `src/lib/storage/signed-url.ts` — `validateUpload` only checks MIME + size; no AV stage yet | We don't have a chosen AV provider (ClamAV vs Cloudmersive vs S3 Object Lambda); deciding it is out of scope for Phase 0 | Phase 8 (infra hardening) — wire chosen AV scanner into the upload pipeline |
| Real auth callback redirect domain | `src/app/auth/callback/route.ts` — uses `request.nextUrl.origin` which trusts the incoming host | Fine for local + Vercel previews; production deploy may need an allow-list | Phase 8 (auth hardening) — pin to `NEXT_PUBLIC_SITE_URL` once domain is locked |
| `pg_prove` not run locally | `package.json` `test:rls` script + `.github/workflows/test.yml` | Docker not running on the dev machine during Phase 0 implementation; pgTAP tests do run in CI on every PR | Already wired in CI — no replacement needed, just a heads-up |

---

## How to use this file

1. Each phase appends a section like the one above when it ships.
2. Anything checked off (replaced with the real implementation) gets struck through but **stays in the file** for audit history.
3. Before launch we run a final pass and confirm zero un-struck rows remain.

---

## Convention for stub comments in code

Every stub is grep-able. Inside the file we use one of:

```ts
// STUB: <one-line explanation> — replace in Phase <N>
```

or for fenced data:

```sql
-- STUB: <one-line explanation>
```

Search for `STUB:` to find them all.
