/** Reset-password page — sets a new password after clicking the email link. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { BrandLockup } from "@/components/ui/brand-mark";
import {
  EditorialEyebrow,
  Hairline,
  RidgeArtwork,
} from "@/components/brand";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      setTimeout(() => router.push("/login"), 2000);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[5fr_6fr]">
      <aside className="relative isolate overflow-hidden bg-[hsl(233_70%_8%)] text-[hsl(40_28%_92%)] flex flex-col justify-between p-8 lg:p-12 min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 -z-10 opacity-90">
          <RidgeArtwork
            seed="bright.newpass"
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
            New Password
          </EditorialEyebrow>
          <h1 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05] text-[hsl(40_28%_94%)]">
            Choose a new&nbsp;password.
          </h1>
          <p className="mt-4 text-base text-[hsl(40_28%_92%)]/80 max-w-[44ch]">
            Pick something strong — at least 8 characters.
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
          <EditorialEyebrow accent>Set password</EditorialEyebrow>
          <h2 className="text-display text-foreground text-[clamp(1.75rem,3vw,2.5rem)] mt-2 leading-tight">
            Create your new password.
          </h2>

          {done ? (
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-emerald-600/30 bg-emerald-50/60 px-4 py-3">
                <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Password updated</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Redirecting you to sign in…
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground max-w-[42ch]">
                Enter and confirm your new password below.
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
                  <label htmlFor="password" className="text-overline text-muted-foreground">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-[var(--color-bb-cobalt)] focus:border-[var(--color-bb-cobalt)] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-overline text-muted-foreground">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Type it again"
                    className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-[var(--color-bb-cobalt)] focus:border-[var(--color-bb-cobalt)] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-bb-cobalt)] px-4 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>Updating password…</>
                  ) : (
                    <>
                      <Lock size={16} />
                      Set new password
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
