/**
 * Root error boundary — last line of defence. Must include its own
 * <html> and <body> since the root layout may itself have thrown.
 */
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0, minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", backgroundColor: "#0a0a0f", color: "#e4e4e7",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ maxWidth: 420, textAlign: "center", padding: "0 24px" }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 24px", borderRadius: 16,
            border: "1px solid rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>
            ⚠
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 8 }}>
            An unexpected error occurred. If this keeps happening, contact
            your Bright.Blue account manager.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#71717a", fontVariantNumeric: "tabular-nums" }}>
              Error reference: {error.digest}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
            <button
              onClick={reset}
              style={{
                height: 40, padding: "0 20px", borderRadius: 6, border: "none",
                background: "linear-gradient(135deg, hsl(230,93%,53%), hsl(230,93%,60%))",
                color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* Hard navigation on purpose — the app may be in a broken state. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                height: 40, padding: "0 20px", borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
                color: "#e4e4e7", fontSize: 14, fontWeight: 500, textDecoration: "none",
                display: "inline-flex", alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
