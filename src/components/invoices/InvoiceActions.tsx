"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateInvoiceStatus, type InvoiceStatus } from "@/app/actions/invoices";

interface InvoiceActionsProps {
  invoiceId: string;
  status: InvoiceStatus;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(newStatus: InvoiceStatus) {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, newStatus);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Invoice marked as ${newStatus}`);
      router.refresh();
    });
  }

  if (pending) return <Loader2 size={14} className="animate-spin text-muted-foreground" />;

  return (
    <div className="flex items-center gap-1">
      {status === "draft" && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleAction("issued")}>
          <Send size={12} /> Issue
        </Button>
      )}
      {(status === "issued" || status === "overdue") && (
        <Button variant="ghost" size="sm" className="text-xs text-emerald-400" onClick={() => handleAction("paid")}>
          <CheckCircle2 size={12} /> Mark paid
        </Button>
      )}
    </div>
  );
}
