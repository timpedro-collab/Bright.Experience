/** Customer-facing "let Bright.Studio fix it" CTA on a struggling asset. */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestStudioFixForAsset } from "@/app/actions/studio";

export function StudioFixButton({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await requestStudioFixForAsset(assetId);
      if (!result.success) {
        toast.error(result.error ?? "Could not raise the Studio order.");
        return;
      }
      toast.success(
        "Bright.Studio is on it — we'll handle this asset for you.",
      );
      router.refresh();
    });
  }

  return (
    <Button
      variant="glass"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="mt-2"
    >
      <Sparkles className="h-4 w-4" />
      {pending ? "Raising order…" : "Let Bright.Studio fix it"}
    </Button>
  );
}
