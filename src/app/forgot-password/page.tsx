/** Forgot-password page — sends a Supabase password-reset email. */
"use client";

import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { requestPasswordReset } from "@/app/actions/auth";
import { BrandLockup } from "@/components/ui/brand-mark";
import {
  EditorialEyebrow,
  Hairline,
  RidgeArtwork,
} from "@/components/brand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await requestPasswordReset(email);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[5fr_6fr]">
      <aside className="relative isolate overflow-hidden bg-[hsl(233_70%_8%)] text-[hsl(40_28%_92%)] flex flex-col justify-between p-8 lg:p-12 min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 -z-10 opacity-90">
          <RidgeArtwork
            seed="bright.reset"
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
          <EditorialEyebrow accent className="text-[hsl(189_100%_75%)]">
            Password Reset
          </EditorialEyebrow>
          <h1 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05] text-[hsl(40_28%_94%)]">
            We&rsquo;ll get you back&nbsp;in.
          </h1>
          <p className="mt-4 text-base text-[hsl(40_28%_92%)]/80 max-w-[44ch]">
            Enter your email and we&rsquo;ll send a link to reset your password.
          </p>
        </div>
        <footer className="relative text-overline text-[hsl(40_28%_92%)]/60">
          <span className="text-[hsl(40_28%_92%)]">bright.blue</span>
          <span className="mx-2 opacity-50">/</span>
          London · Milton Keynes · Minneapolis · Prague · Dubai
        </footer>
      </aside>

      <main className="theme-light bg-[hsl(40_30%_91%)] text-[hsl(233_50%_8%)] flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[480px]">
          <EditorialEyebrow accent>Forgot password</EditorialEyebrow>
          <h2 className="text-display text-foreground text-[clamp(1.75rem,3vw,2.5rem)] mt-2 leading-tight">
            Reset your password.
          </h2>

          {sent ? (
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-emerald-600/30 bg-emerald-50/60 px-4 py-3">
                <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Check your inbox</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    We sent a password-reset link to <strong>{email}</strong>. It
                    may take a minute to arrive.
                  </p>
                </div>
              </div>
              <Hairline className="opacity-60" />
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-bb-cobalt)] hover:underline"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground max-w-[42ch]">
                Enter the email associated with your account and we&rsquo;ll send
                you a link to create a new password.
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
                  <label htmlFor="email" className="text-overline text-muted-foreground">
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
                    className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-[var(--color-bb-cobalt)] focus:border-[var(--color-bb-cobalt)] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-bb-cobalt)] px-4 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>Sending reset link…</>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send reset link
                    </>
                  )}
                </button>
              </form>

              <Hairline className="my-8 opacity-60" />

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-bb-cobalt)] hover:underline"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
