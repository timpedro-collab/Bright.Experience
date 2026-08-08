/**
 * Champion one-pager — the whole proposal on a single page, designed to be
 * printed to PDF and forwarded to whoever signs it off.
 *
 * Lives in the bare (print) route group so no site chrome (nav, footer)
 * appears in the capture. Rendered to PDF by
 * /api/quotes/:id/one-pager-pdf via the shared Puppeteer pipeline.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getQuoteForProposal } from "@/lib/queries/quotes";
import { buildProposalDocument } from "@/lib/proposals/build-proposal";
import { buildDeRiskItems } from "@/lib/proposals/proposal-extras";
import { formatPriceBand } from "@/lib/proposals/price-band";
import { formatGBP } from "@/lib/roi";
import { formatNumberUS } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Proposal one-pager",
  description: "The proposal in one page, ready to forward.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalOnePagerPage({ params }: PageProps) {
  const { id } = await params;
  const quote = await getQuoteForProposal(id);
  if (!quote) notFound();

  const doc = buildProposalDocument(quote);
  const priceRevealed =
    Boolean(quote.walkthrough_completed_at) || quote.status === "accepted";

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const proposalUrl = `${proto}://${host}/proposal/${quote.id}`;

  const investmentLine = priceRevealed
    ? `${formatGBP(doc.investment.feePence / 100)} all-in (excl. VAT)`
    : doc.investment.indicativeBand
      ? `${formatPriceBand(doc.investment.indicativeBand)} indicative — exact figure on the walkthrough`
      : "Priced on the walkthrough call";

  const deRisk = buildDeRiskItems();

  return (
    <main className="one-pager mx-auto max-w-3xl bg-background px-10 py-10 text-foreground">
      {/* Header */}
      <p className="text-overline tracking-[0.25em] text-[var(--color-bb-cobalt)]">
        Bright.Blue · Proposal in one page
      </p>
      <h1 className="mt-3 text-display text-3xl font-bold leading-tight">
        {doc.cover.title}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{doc.cover.subtitle}</p>

      {/* Key facts */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {doc.cover.facts.map((f) => (
          <div
            key={f.label}
            className="rounded-lg border border-border/60 px-3 py-2.5"
          >
            <p className="text-sm font-bold">{f.value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {f.label}
            </p>
          </div>
        ))}
      </div>

      {/* What + why */}
      <section className="mt-7">
        <h2 className="text-overline text-[var(--color-bb-cobalt)]">What it is</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {doc.solution.intro}
        </p>
      </section>

      {/* Numbers */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {doc.reach && (
          <div className="rounded-lg border border-border/60 p-4">
            <h2 className="text-overline text-[var(--color-bb-cobalt)]">
              Projected reach
            </h2>
            <p className="mt-2 text-sm text-foreground/90">
              {formatNumberUS(doc.reach.impressions)} impressions ·{" "}
              {formatNumberUS(doc.reach.leads)} leads
              <span className="block text-xs text-muted-foreground">
                {doc.reach.context}
              </span>
            </p>
          </div>
        )}
        <div className="rounded-lg border border-border/60 p-4">
          <h2 className="text-overline text-[var(--color-bb-cobalt)]">
            Investment
          </h2>
          <p className="mt-2 text-sm text-foreground/90">{investmentLine}</p>
        </div>
      </section>

      {/* De-risk */}
      <section className="mt-6">
        <h2 className="text-overline text-[var(--color-bb-cobalt)]">
          How it&apos;s de-risked
        </h2>
        <ul className="mt-2 space-y-1.5">
          {deRisk.map((item) => (
            <li key={item.title} className="text-xs leading-relaxed">
              <span className="font-semibold">{item.title}.</span>{" "}
              <span className="text-muted-foreground">{item.body}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Next step + link */}
      <section className="mt-7 rounded-lg border border-[var(--color-bb-cobalt)]/30 bg-[var(--color-bb-cobalt)]/[0.05] p-4">
        <p className="text-sm font-semibold">
          Next step: a 15-minute walkthrough call.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Full proposal (no login needed):{" "}
          <span className="text-[var(--color-bb-cobalt)]">{proposalUrl}</span>
        </p>
      </section>

      <p className="mt-6 text-[10px] text-muted-foreground">
        © Bright.Blue Events · Confidential · hello@brightblue.com
      </p>
    </main>
  );
}
