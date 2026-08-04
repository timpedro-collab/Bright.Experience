/** Polls the server-rendered public live page every minute. */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveShareAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <p className="text-xs text-muted-foreground text-center">
      Updates every minute
    </p>
  );
}
