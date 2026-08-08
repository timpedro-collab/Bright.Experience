/** Admin invoice dashboard — outstanding invoices with aging summary. */
import { redirect } from "next/navigation";
import { Receipt, AlertTriangle, Clock } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import {
  KpiCard,
  KpiGrid,
  DataTableShell,
  StatusPill,
  type Column,
} from "@/components/cloud";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getOutstandingInvoices, type Invoice } from "@/app/actions/invoices";
import { formatDateShort } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";

export const metadata = {
  title: "Invoices",
};

function agingBadge(invoice: Invoice) {
  if (!invoice.dueAt) return null;
  const now = new Date();
  const due = new Date(invoice.dueAt);
  const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (invoice.status === "overdue") {
    if (diffDays > 30) {
      return <Badge variant="destructive" className="text-[10px]">30+ days</Badge>;
    }
    if (diffDays > 14) {
      return <Badge variant="destructive" className="text-[10px]">{diffDays}d overdue</Badge>;
    }
    return <Badge variant="warning" className="text-[10px]">{diffDays}d overdue</Badge>;
  }

  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) {
    return <Badge variant="warning" className="text-[10px]">Due in {daysUntil}d</Badge>;
  }
  return null;
}

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [invoices, unread] = await Promise.all([
    getOutstandingInvoices(),
    getUnreadCount(user.id),
  ]);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const issued = invoices.filter((i) => i.status === "issued");
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.amount, 0);

  const columns: Column<Invoice>[] = [
    {
      key: "invoice",
      header: "Invoice",
      cell: (inv) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {inv.invoiceNumber}
            </span>
            <StatusPill
              label={inv.status}
              tone={inv.status === "overdue" ? "rejected" : "pending"}
            />
            {agingBadge(inv)}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {inv.eventName ?? "Unknown event"} ·{" "}
            {inv.accountName ?? "Unknown client"}
            {inv.dueAt && ` · Due ${formatDateShort(inv.dueAt)}`}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (inv) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatMoneyFromPence(inv.amount, { decimals: true })}
        </span>
      ),
    },
  ];

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Invoices"
      eyebrow="Internal · Finance"
      title="Outstanding invoices."
      subtitle="A read-only mirror of every open invoice — raised and settled in the finance system, overdue items auto-escalate via the notification spine."
    >
      <div className="py-8 space-y-8">
        <KpiGrid className="lg:grid-cols-3">
          <KpiCard
            label="Total outstanding"
            value={formatMoneyFromPence(totalOutstanding, { decimals: true })}
            icon={Receipt}
            hint={`${invoices.length} open invoice${invoices.length === 1 ? "" : "s"}`}
          />
          <KpiCard
            label="Issued"
            value={issued.length}
            icon={Clock}
            hint="Awaiting payment"
          />
          <KpiCard
            label="Overdue"
            value={overdue.length}
            icon={AlertTriangle}
            trend={overdue.length > 0 ? "down" : "flat"}
            delta={overdue.length > 0 ? "Action needed" : undefined}
          />
        </KpiGrid>

        <DataTableShell
          title="Open invoices"
          description="Overdue items auto-escalate via the notification spine."
          columns={columns}
          rows={invoices}
          getRowKey={(inv) => inv.id}
          emptyTitle="Everything is paid up"
          emptyDescription="No outstanding invoices across any event. New invoices appear here the moment they're issued."
        />
      </div>
    </AdminPageShell>
  );
}
