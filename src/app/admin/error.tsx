/**
 * Admin section error boundary — catches failures inside the admin tree
 * and offers retry / navigate-home without exposing internal details.
 */
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <AlertTriangle size={28} className="text-destructive" />
        </div>

        <div>
          <h1 className="text-heading text-xl font-semibold mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            The admin page couldn&apos;t load. If this keeps happening,
            contact engineering.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              Error reference: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="brand" onClick={reset}>
            <RefreshCw size={14} />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
