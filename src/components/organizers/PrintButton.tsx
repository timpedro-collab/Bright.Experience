"use client";

/**
 * Prints the page it sits on, and removes itself from the printout.
 *
 * The spec sheet exists to be handed to a venue, and the two ways that happens
 * are paper and a PDF attachment — both of which are the browser's print
 * dialogue. Sending the organizer to the menu bar for it would be the one
 * awkward step in an otherwise finished job.
 */

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = "Print or save as PDF" }: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer size={14} /> {label}
    </Button>
  );
}
