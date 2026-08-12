"use client";

/**
 * Revoke a live partner-pricing page.
 *
 * Confirmed in place rather than in a dialog: revoking kills the slug
 * credential immediately, so it shouldn't be a single stray click.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { revokePartnerPricingPage } from "@/app/actions/partner-pricing";

interface RevokePageButtonProps {
  pageId: string;
}

export function RevokePageButton({ pageId }: RevokePageButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokePartnerPricingPage(pageId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Page revoked");
      setConfirming(false);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label="Revoke page"
      >
        Revoke
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.65rem] text-muted-foreground">Really revoke?</span>
      <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={pending}>
        {pending ? <Loader2 size={13} className="animate-spin" /> : null}
        Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
