/** Internal proposal builder — add line items and send proposal */
import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getQuoteById } from "@/lib/queries/quotes";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuoteStatusBadge } from "@/components/quotes/QuoteStatusBadge";
import { ProposalBuilder } from "./ProposalBuilder";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const quote = await getQuoteById(id);
  if (!quote) notFound();

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title={`Quote — ${quote.contact_name}`}
        subtitle={quote.company_name ?? quote.contact_email}
        breadcrumbs={[
          { label: "Quotes", href: "/admin/quotes" },
          { label: quote.contact_name },
        ]}
        actions={<QuoteStatusBadge status={quote.status} />}
      />
      <ProposalBuilder quote={quote} />
    </AppShell>
  );
}
