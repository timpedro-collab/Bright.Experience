"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bb-bg-primary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--bb-text-primary)]">
            Bright
            <span className="text-[var(--bb-electric-blue)]">.Experience</span>
          </h1>
          <p className="mt-2 text-[var(--bb-text-secondary)]">
            Sign in to your delivery portal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bb-bg-secondary)] rounded-[var(--radius-card)] p-8 shadow-[var(--bb-shadow-md)] border border-[var(--bb-border-subtle)]"
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--bb-text-primary)] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--bb-border-default)] bg-[var(--bb-bg-primary)] text-[var(--bb-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--bb-electric-blue)] focus:border-transparent transition-shadow"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--bb-text-primary)] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--bb-border-default)] bg-[var(--bb-bg-primary)] text-[var(--bb-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--bb-electric-blue)] focus:border-transparent transition-shadow"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-[var(--bb-electric-blue)] text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--bb-electric-blue)] focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-6 pt-4 border-t border-[var(--bb-border-subtle)]">
            <p className="text-xs text-[var(--bb-text-tertiary)] text-center mb-3">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { email: "sarah@brightblue.co.uk", label: "Events Lead" },
                {
                  email: "james.chen@cocacola.com",
                  label: "Customer Admin",
                },
                { email: "emma@brightblue.co.uk", label: "Creative Lead" },
                { email: "tom@brightblue.co.uk", label: "Ops Lead" },
              ].map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword("demo-password-123");
                  }}
                  className="text-xs px-3 py-2 rounded-lg border border-[var(--bb-border-subtle)] text-[var(--bb-text-secondary)] hover:bg-[var(--bb-bg-tertiary)] transition-colors cursor-pointer"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
