/** Grid/table view switch for the internal events library — persists in URL. */
"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LibraryViewToggle({ view }: { view: "grid" | "table" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const setView = useCallback(
    (next: "grid" | "table") => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "grid") params.delete("view");
      else params.set("view", next);
      params.delete("page");
      startTransition(() => router.push(`/?${params.toString()}`));
    },
    [router, searchParams],
  );

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      {(["grid", "table"] as const).map((v) => {
        const Icon = v === "grid" ? LayoutGrid : Table2;
        const active = view === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={active}
            aria-label={`${v} view`}
            className={cn(
              "inline-flex h-7 w-8 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
