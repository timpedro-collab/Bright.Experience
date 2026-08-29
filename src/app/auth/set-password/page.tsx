/** Set-password page — first-time invited users choose a password here. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { BrandLockup } from "@/components/ui/brand-mark";
import {
  EditorialEyebrow,
  Hairline,
  RidgeArtwork,
} from "@/components/brand";

export default function SetPasswordPage() {
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
      setTimeout(() => router.push("/welcome"), 2000);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[5fr_6fr] bg-background text-foreground">
      <aside className="relative isolate overflow-hidden flex flex-col justify-between p-8 lg:p-12 min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 -z-10 opacity-90">
          <RidgeArtwork
            seed="bright.welcome"
            lines={36}
            amplitude={110}
            className="text-primary"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-background/95 via-background/60 to-transparent"
          />
        </div>
        <header className="relative">
          <BrandLockup size="md" tagline="The portal for your activations" />
        </header>
        <div className="relative max-w-[34ch]">
          <EditorialEyebrow accent>Welcome aboard</EditorialEyebrow>
          <h1 className="text-display text-[clamp(2rem,3.5vw,3.25rem)] mt-3 leading-[1.05] text-foreground">
            Set your&nbsp;
            <span className="text-brand-gradient">password</span>.
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-[44ch]">
            You&apos;ve been invited to Bright.Experience. Choose a password to
            secure your account.
          </p>
        </div>
        <footer className="relative text-overline text-muted-foreground">
          <span className="text-foreground">bright.blue</span>
          <span className="mx-2 opacity-50">/</span>
          London · Milton Keynes · Minneapolis · Prague · Dubai
        </footer>
      </aside>

      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[480px]">
          <EditorialEyebrow accent>Almost there</EditorialEyebrow>
          <h2 className="text-display text-foreground text-[clamp(1.75rem,3vw,2.5rem)] mt-2 leading-tight">
            Choose your password.
          </h2>

          {done ? (
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-success/30 bg-success/15 px-4 py-3">
                <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-success">
                    You&apos;re all set!
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Taking you to your portal…
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground max-w-[42ch]">
                Pick something strong — at least 8 characters. You&apos;ll use
                this to sign in from now on.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-overline text-muted-foreground">
                    Password
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
                    className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
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
                    className="w-full bg-card text-foreground placeholder:text-muted-foreground/70 px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>Setting password…</>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Set password &amp; enter portal
                    </>
                  )}
                </button>
              </form>

              <Hairline className="my-8 opacity-60" />

              <p className="text-xs text-muted-foreground">
                By continuing you agree to the Bright.Blue{" "}
                <a href="/terms" className="underline">terms of service</a> and{" "}
                <a href="/privacy" className="underline">privacy policy</a>.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
