/**
 * Login — the first impression for every visitor.
 *
 * Two-panel split:
 *   - Left:  full-bleed deep-ink panel with the signature generative ridge
 *            artwork, the gradient brand lockup, an editorial eyebrow, and
 *            an editorial subhead.
 *   - Right: warm linen-paper panel with the actual sign-in form, demo
 *            account pills, and supporting microcopy.
 *
 * The split is the same "confident spread" the Proposal Edition uses, so
 * a brand-new customer arriving at /login immediately sees the same
 * design language they'll see in every other surface they touch.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { BrandLockup } from "@/components/ui/brand-mark";
import {
  EditorialEyebrow,
  Hairline,
  RidgeArtwork,
} from "@/components/brand";

const DEMO_ACCOUNTS: Array<{ email: string; label: string; role: string }> = [
  { email: "sarah@brightblue.co.uk", label: "Sarah Chen", role: "Events Lead" },
  { email: "james.chen@cocacola.com", label: "James Chen", role: "Customer" },
  { email: "emma@brightblue.co.uk", label: "Emma Rivera", role: "Creative" },
  { email: "tom@brightblue.co.uk", label: "Tom Park", role: "Ops" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const isDev = process.env.NODE_ENV === "development";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
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

      {/* ── Right: linen-paper form panel ───────────────────────────── */}
      <main className="theme-light bg-[hsl(40_30%_91%)] text-[hsl(233_50%_8%)] flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[480px]">
          <EditorialEyebrow accent>Sign in</EditorialEyebrow>
          <h2 className="text-display text-foreground text-[clamp(1.75rem,3vw,2.5rem)] mt-2 leading-tight">
            Open your portal.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-[42ch]">
            Sign in with the email your account manager sent you. New here?{" "}
            <a
              href="mailto:hello@brightblue.co.uk"
              className="text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4"
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
                className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--color-bb-cobalt)] focus:border-[var(--color-bb-cobalt)] transition"
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
                className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--color-bb-cobalt)] focus:border-[var(--color-bb-cobalt)] transition"
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
                className="text-sm text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 hover:opacity-80 transition-opacity"
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
                        className="w-full text-left rounded-md border border-border bg-card/60 hover:bg-card hover:border-[var(--color-bb-cobalt)]/50 px-3 py-2 transition group"
                      >
                        <span className="block text-sm text-foreground font-medium">
                          {demo.label}
                        </span>
                        <span className="text-overline text-muted-foreground group-hover:text-[var(--color-bb-cobalt)] transition-colors">
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
