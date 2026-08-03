/** Forward-to-a-colleague for the proposal microsite — a prefilled mailto, because the buyer's next step is almost always 'send it to the person who signs'. */
"use client";

import { Forward } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ShareProposalButtonProps {
  proposalUrl: string;
  companyName?: string;
}

export function ShareProposalButton({ proposalUrl, companyName }: ShareProposalButtonProps) {
  function handleClick() {
    const subject = `Bright.Blue proposal${companyName ? ` for ${companyName}` : ""}`;
    const body = `Worth a look — our tailored activation proposal from Bright.Blue:\n\n${proposalUrl}\n\nThe numbers and what's included are all in there.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <Button variant="glass" size="sm" onClick={handleClick}>
      <Forward className="h-4 w-4" />
      Forward to a colleague
    </Button>
  );
}
