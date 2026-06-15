/** Client button that triggers benchmark recalculation and refreshes the page. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBenchmarks } from "@/app/actions/reports";

export function RecalculateBenchmarksButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const result = await updateBenchmarks();
      if (result.success) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={handleClick}>
      <RefreshCw className={loading ? "animate-spin" : ""} />
      {loading ? "Recalculating…" : "Recalculate benchmarks"}
    </Button>
  );
}
