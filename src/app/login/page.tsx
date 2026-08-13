/**
 * Login — the first impression for every visitor.
 *
 * Two-panel split (both deep-ink in the current theme):
 *   - Left:  generative ridge artwork, brand lockup, editorial eyebrow/subhead.
 *   - Right: sign-in form, demo account pills (dev only), supporting microcopy.
 *
 * `?redirect=` is allow-listed to same-origin relative paths only.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { signInWithPassword } from "@/app/actions/auth";
import { BrandLockup } from "@/components/ui/brand-mark";
import {
  EditorialEyebrow,
  Hairline,
  RidgeArtwork,
} from "@/components/brand";

const DEMO_ACCOUNTS: Array<{ email: string; label: string; role: string }> = [
  { email: "tim@brightblue.co.uk", label: "Tim Pedro", role: "Event Lead" },
  { email: "sofia@brightblue.co.uk", label: "Sofia Reyes", role: "Admin" },
  { email: "james.chen@cocacola.com", label: "James Chen", role: "Customer Admin" },
  { email: "priya.sharma@cocacola.com", label: "Priya Sharma", role: "Customer" },
  { email: "theo@brightblue.co.uk", label: "Theo Roturu", role: "Creative" },
  { email: "dan@brightblue.co.uk", label: "Dan Barnes", role: "Ops" },
  { email: "alex@brightblue.co.uk", label: "Alex Rivera", role: "QA" },
  { email: "maya@northern.events", label: "Maya Patel", role: "Reseller Partner" },
  { email: "leo@northern.events", label: "Leo Grant", role: "Reseller · Member" },
  { email: "aaron@kingsx.london", label: "Aaron Howe", role: "Venue · Kings Cross Hall" },
  { email: "daniel@westfield-stratford.com", label: "Daniel Cole", role: "Venue · Westfield" },
  { email: "nadia@informatech.events", label: "Nadia Okafor", role: "Organizer · Tech Live London" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  // Same-origin relative paths only — block protocol-relative and absolute URLs.
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
  const isDev = process.env.NODE_ENV === "development";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signInWithPassword(email, password);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      // The tour no longer auto-replays on sign-in. It stays available on
      // demand via the "Take the tour" item in the user menu (and the
      // /welcome screen), so signing in never forces a skip.
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[5fr_6fr]">
      {/* ── Left: ridge artwork canvas ─────────────────────────────── */}
      <aside className="relative isolate overflow-hidden bg-[hsl(233_70%_8%)] text-[hsl(40_28%_92%)] flex flex-col justify-between p-8 lg:p-12 min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 -z-10 opacity-90">
          <RidgeArtwork
            seed="bright.experience"
            lines={36}
            amplitude={110}
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-[hsl(233_70%_8%)]/95 via-[hsl(233_70%_8%)]/60 to-transparent"
          />
        </div>

        <header className="relative">
          <BrandLockup size="md" tagline="The portal for your activations" />
        </header>

        <div className="relative max-w-[34ch]">
          <EditorialEyebrow
            accent
            className="text-[hsl(189_100%_75%)]"
          >
            Welcome back
          </EditorialEyebrow>
          <h1 className="text-display text-foreground text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05] text-[hsl(40_28%_94%)]">
            Every activation, in&nbsp;one&nbsp;place.
          </h1>
          <p className="mt-4 text-base text-[hsl(40_28%_92%)]/80 max-w-[44ch]">
            Briefings, approvals, live event dashboards, and post-event reports —
            for every edition you have in flight with bright.blue.
          </p>
        </div>

        <footer className="relative text-overline text-[hsl(40_28%_92%)]/60">
          <span className="text-[hsl(40_28%_92%)]">bright.blue</span>
          <span className="mx-2 opacity-50">/</span>
          London · Milton Keynes · Minneapolis · Prague · Dubai
        </footer>
      </aside>

      {/* ── Right: deep-ink form panel (congruent with the left) ─────── */}
      <main className="theme-dark relative isolate overflow-hidden bg-[hsl(233_70%_8%)] text-[hsl(40_28%_92%)] flex items-center justify-center p-6 lg:p-12">
        {/* Soft cobalt/cyan glow so the panel echoes the ridge artwork */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full bg-[hsl(230,93%,53%)]/15 blur-[150px]" />
          <div className="absolute -bottom-1/4 left-0 h-[45vh] w-[45vh] rounded-full bg-[hsl(189,100%,55%)]/10 blur-[130px]" />
        </div>
        <div className="w-full max-w-[480px]">
          <EditorialEyebrow accent className="text-[hsl(189_100%_75%)]">
            Sign in
          </EditorialEyebrow>
          <h2 className="text-display text-[hsl(40_28%_94%)] text-[clamp(1.75rem,3vw,2.5rem)] mt-2 leading-tight">
            Open your portal.
          </h2>
          <p className="mt-3 text-sm text-[hsl(40_28%_92%)]/70 max-w-[42ch]">
            Sign in with the email your account manager sent you. New here?{" "}
            <a
              href="mailto:hello@brightblue.co.uk"
              className="text-[hsl(189_100%_75%)] underline decoration-from-font underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Get an invite
            </a>
            .
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-[hsl(0_72%_48%)]/40 bg-[hsl(0_72%_48%)]/8 px-3 py-2 text-sm text-[hsl(0_72%_38%)]"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-overline text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full bg-white/[0.04] text-[hsl(40_28%_92%)] placeholder:text-white/35 px-4 py-2.5 rounded-xl border border-white/12 focus:outline-none focus:ring-2 focus:ring-[hsl(189,100%,65%)] focus:border-[hsl(189,100%,65%)] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-overline text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full bg-white/[0.04] text-[hsl(40_28%_92%)] placeholder:text-white/35 px-4 py-2.5 rounded-xl border border-white/12 focus:outline-none focus:ring-2 focus:ring-[hsl(189,100%,65%)] focus:border-[hsl(189,100%,65%)] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-bb-cobalt)] px-4 py-3 text-sm font-medium text-primary-foreground shadow-[var(--bb-shadow-premium)] transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>Signing you in…</>
              ) : (
                <>
                  Open your portal
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <a
                href="/forgot-password"
                className="text-sm text-[hsl(189_100%_75%)] underline decoration-from-font underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Forgot your password?
              </a>
            </div>
          </form>

          {isDev && (
            <>
              <Hairline className="my-8 opacity-60" />

              <section aria-label="Demo accounts">
                <EditorialEyebrow className="mb-3">
                  Demo accounts
                </EditorialEyebrow>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((demo) => (
                    <li key={demo.email}>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(demo.email);
                          setPassword("demo-password-123");
                        }}
                        className="w-full text-left rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-[hsl(189,100%,65%)]/40 px-3 py-2 transition group"
                      >
                        <span className="block text-sm text-[hsl(40_28%_92%)] font-medium">
                          {demo.label}
                        </span>
                        <span className="text-overline text-white/45 group-hover:text-[hsl(189_100%_75%)] transition-colors">
                          {demo.role}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
