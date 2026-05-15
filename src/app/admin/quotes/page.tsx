/** Internal quote queue dashboard — all quotes with filter/sort */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getQuotes } from "@/lib/queries/quotes";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuoteQueueTable } from "@/components/quotes/QuoteQueueTable";

export default async function QuotesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const quotes = await getQuotes();

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Quote Queue"
        subtitle="Manage all Book Now and Proposal requests"
      />
      <QuoteQueueTable quotes={quotes as Parameters<typeof QuoteQueueTable>[0]["quotes"]} />
    </AppShell>
  );
}
