/**
 * Renders a generated ProposalDocument as the 10-section editorial proposal.
 *
 * Server component — the only interactive parts (accept/decline) live in
 * <ProposalActions>. The investment section is gated: until the walkthrough
 * is complete we show a "book your 15-minute walkthrough" card instead of the
 * price, so pricing is always discussed on a call first.
 */
import { CalendarClock, Check, Sparkles, Eye, Users, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Hairline } from "@/components/brand";
import { formatGBP } from "@/lib/roi";
import { formatNumberUS, formatMoneyFromPence } from "@/lib/currency";
import { formatPriceBand } from "@/lib/proposals/price-band";
import {
  ALWAYS_ON_OUTCOMES,
  type ProposalDocument,
} from "@/lib/proposals/build-proposal";
import { ProposalActions } from "./ProposalActions";

interface ProposalDocumentViewProps {
  doc: ProposalDocument;
  quoteId: string;
  /** Pricing + accept/decline are revealed only after the walkthrough. */
  priceRevealed: boolean;
  /** Whether the customer can still accept/decline (status === proposal_sent). */
  canRespond: boolean;
  walkthroughUrl: string;
}

function ReachStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div>
      <Icon className="size-5 text-[var(--color-bb-cobalt)]" aria-hidden />
      <p className="mt-2 text-display text-2xl font-bold tabular-nums text-foreground md:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 text-overline text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHead({
  number,
  eyebrow,
  headline,
  intro,
}: {
  number: string;
  eyebrow: string;
  headline: string;
  intro?: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-overline tracking-[0.2em] text-[var(--color-bb-cobalt)]">
        {number} · {eyebrow}
      </p>
      <h2 className="mt-3 text-heading text-3xl font-bold text-foreground md:text-4xl text-balance">
        {headline}
      </h2>
      {intro && (
        <p className="mt-4 max-w-[64ch] text-base text-muted-foreground leading-relaxed">
          {intro}
        </p>
      )}
    </div>
  );
}

export function ProposalDocumentView({
  doc,
  quoteId,
  priceRevealed,
  canRespond,
  walkthroughUrl,
}: ProposalDocumentViewProps) {
  return (
    <div className="space-y-20 md:space-y-28">
      {/* Mini-nav for desktop scannability */}
      <nav className="sticky top-4 z-10 hidden md:block">
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <a href="#brief" className="hover:text-foreground">01 Brief</a>
          <a href="#solution" className="hover:text-foreground">02 Solution</a>
          <a href="#creative" className="hover:text-foreground">03 Creative</a>
          <a href="#data" className="hover:text-foreground">04 Data</a>
          <a href="#included" className="hover:text-foreground">05 Included</a>
          <a href="#investment" className="hover:text-foreground">06 Investment</a>
          <a href="#timeline" className="hover:text-foreground">07 Timeline</a>
          <a href="#next" className="hover:text-foreground">08 Next steps</a>
          <a href="#addons" className="hover:text-foreground">09 Add-ons</a>
        </div>
      </nav>

      {/* ---- Cover ---- */}
      <section className="text-center">
        <p className="text-overline tracking-[0.25em] text-[var(--color-bb-cobalt)]">
          Bright.Blue · Proposal
        </p>
        <h1 className="mt-5 text-display text-5xl font-bold leading-[1.05] text-foreground md:text-6xl text-balance">
          {doc.cover.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{doc.cover.subtitle}</p>
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-stretch justify-center gap-3">
          {doc.cover.facts.map((f) => (
            <div
              key={f.label}
              className="flex-1 min-w-[8rem] rounded-[var(--radius-card)] border border-border/60 bg-card/40 px-5 py-4"
            >
              <p className="text-display text-xl font-bold text-foreground">{f.value}</p>
              <p className="mt-1 text-overline text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Projected reach band ---- */}
      {doc.reach && (
        <section>
          <Card tone="elevated" className="relative overflow-hidden p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(230,93%,53%,0.08),hsl(189,100%,75%,0.05))]"
            />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-overline tracking-[0.2em] text-[var(--color-bb-cobalt)]">
                  Projected reach
                </p>
                <span className="text-sm text-muted-foreground">{doc.reach.context}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3">
                <ReachStat icon={Eye} value={formatNumberUS(doc.reach.impressions)} label="Impressions" />
                <ReachStat icon={Users} value={formatNumberUS(doc.reach.leads)} label="Leads" />
                {doc.reach.doohMediaValueCents != null && (
                  <ReachStat icon={MapPin} value={`Up to ${formatMoneyFromPence(doc.reach.doohMediaValueCents)}`} label="DOOH media value" />
                )}
              </div>
              <p className="mt-5 max-w-[64ch] text-xs leading-relaxed text-muted-foreground">
                {doc.reach.track === "experiential"
                  ? "Modelled from the site's real daily footfall and the unit's branded advertising. Final figures confirmed on your walkthrough."
                  : "Scaled from your expected attendance and the unit's branded advertising. Final figures confirmed on your walkthrough."}
              </p>
            </div>
          </Card>
        </section>
      )}

      <Hairline className="opacity-50" />

      {/* ---- 01 The Brief ---- */}
      <section id="brief">
        <SectionHead number="01" eyebrow="The brief" headline={doc.brief.headline} intro={doc.brief.intro} />
        <div className="grid gap-6 md:grid-cols-2">
          <Card tone="subtle" className="p-6">
            <p className="text-overline text-muted-foreground mb-2">The challenge</p>
            <p className="text-sm text-foreground leading-relaxed">{doc.brief.challenge}</p>
          </Card>
          <Card tone="subtle" className="p-6">
            <p className="text-overline text-muted-foreground mb-2">What success looks like</p>
            <p className="text-sm text-foreground leading-relaxed">{doc.brief.success}</p>
          </Card>
        </div>
      </section>

      {/* ---- 02 The Solution ---- */}
      <section id="solution">
        <SectionHead number="02" eyebrow="The solution" headline={doc.solution.headline} intro={doc.solution.intro} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {doc.solution.cascade.map((s) => (
            <li key={s.step} className="rounded-[var(--radius-card)] border border-border/60 bg-card/40 p-5">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--color-bb-cobalt)]/15 text-sm font-semibold text-[var(--color-bb-cobalt)] tabular-nums">
                {s.step}
              </span>
              <p className="mt-3 text-sm font-semibold text-foreground">{s.title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- 03 Creative customisation + tailored add-ons ---- */}
      <section id="creative">
        <SectionHead number="03" eyebrow="Creative customisation" headline={doc.creative.headline} intro={doc.creative.intro} />
        <div className="grid gap-6 sm:grid-cols-2">
          {doc.creative.items.map((it) => (
            <div key={it.title} className="border-l-2 border-[var(--color-bb-cobalt)]/40 pl-4">
              <p className="text-sm font-semibold text-foreground">{it.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>

        {doc.recommendedAddons.length > 0 && (
          <Card tone="subtle" className="mt-8 p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[var(--color-bb-cobalt)]" />
              <p className="text-sm font-semibold text-foreground">Tailored to your brief</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on what you told us, we&apos;ve built these in:
            </p>
            <ul className="mt-4 space-y-3">
              {doc.recommendedAddons.map((a) => (
                <li key={a.slug} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{a.outcome}.</span>{" "}
                    <span className="text-muted-foreground">{a.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="mt-6 text-xs text-muted-foreground leading-relaxed max-w-[64ch]">
          {doc.creative.processNote}
        </p>
      </section>

      {/* ---- 04 Data capture ---- */}
      <section id="data">
        <SectionHead number="04" eyebrow="Data capture" headline={doc.dataCapture.headline} intro={doc.dataCapture.intro} />
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-overline text-muted-foreground">
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">What you get</th>
                <th className="px-4 py-3 font-medium">How</th>
              </tr>
            </thead>
            <tbody>
              {doc.dataCapture.rows.map((r) => (
                <tr key={r.source} className="border-b border-border/40 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-foreground">{r.source}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.what}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-[64ch]">
          {doc.dataCapture.valueNote}
        </p>
      </section>

      {/* ---- 05 What's included ---- */}
      <section id="included">
        <SectionHead number="05" eyebrow="What's included" headline={doc.included.headline} intro={doc.included.intro} />
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-overline text-[var(--color-bb-cobalt)] mb-4">
              Bright.Blue delivers · {doc.included.brightBlueItems.length} items
            </p>
            <ul className="space-y-3">
              {doc.included.brightBlueItems.map((it) => (
                <li key={it.title} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{it.title}</span>
                    <span className="block text-muted-foreground">{it.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-overline text-muted-foreground mb-4">
              You provide · {doc.included.customerItems.length} items
            </p>
            <ul className="space-y-3">
              {doc.included.customerItems.map((it) => (
                <li key={it.title} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{it.title}</span>
                    <span className="block text-muted-foreground">{it.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
          {ALWAYS_ON_OUTCOMES.map((o) => (
            <span key={o} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check size={12} className="text-success" /> {o}
            </span>
          ))}
        </div>
      </section>

      {/* ---- 06 Investment (gated) ---- */}
      <section id="investment">
        {priceRevealed ? (
          <>
            <SectionHead number="06" eyebrow="Investment" headline={doc.investment.headline} />
            <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
              <Card tone="subtle" className="p-8 md:min-w-[16rem]">
                <p className="text-overline text-muted-foreground">{doc.investment.feeLabel}</p>
                <p className="mt-2 text-display text-5xl font-bold tabular-nums text-primary">
                  {formatGBP(doc.investment.feePence / 100)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {doc.investment.durationLabel} · {doc.investment.dateLabel} · all-in
                </p>
              </Card>
              <ul className="divide-y divide-border/40">
                {doc.investment.rows.map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-foreground">{r.label}</span>
                    <span className="text-success text-xs">{r.status}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 text-xs text-muted-foreground leading-relaxed max-w-[64ch]">
              {doc.investment.note}
            </p>
            <ProposalActions quoteId={quoteId} canRespond={canRespond} />
          </>
        ) : (
          <Card tone="subtle" className="p-8 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-[var(--color-bb-cobalt)]" />
            <h2 className="mt-4 text-heading text-2xl font-bold text-foreground">
              Let&apos;s walk you through it
            </h2>
            {doc.investment.indicativeBand && (
              <p className="mx-auto mt-4 max-w-[52ch] text-base text-foreground">
                Activations like this typically run{" "}
                <span className="font-semibold tabular-nums text-primary">
                  {formatPriceBand(doc.investment.indicativeBand)}
                </span>
                .
              </p>
            )}
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-muted-foreground leading-relaxed">
              We confirm your exact figure on a quick 15-minute video call, so
              we can tailor the detail to you and answer any questions before
              you decide. Pick a time that suits.
            </p>
            <a
              href={walkthroughUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-bb-cobalt)] px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
            >
              <CalendarClock className="h-4 w-4" />
              Book your 15-minute walkthrough
            </a>
          </Card>
        )}
      </section>

      {/* ---- 07 Timeline ---- */}
      {doc.timeline.milestones.length > 0 && (
        <section id="timeline">
          <SectionHead number="07" eyebrow="Timeline" headline={doc.timeline.headline} intro={doc.timeline.intro} />
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-overline text-muted-foreground">
                  <th className="px-4 py-3 font-medium w-8">#</th>
                  <th className="px-4 py-3 font-medium">Milestone</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {doc.timeline.milestones.map((m) => (
                  <tr key={m.n} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{m.n}</td>
                    <td className="px-4 py-3 text-foreground">{m.milestone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.owner}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-[64ch]">{doc.timeline.note}</p>
        </section>
      )}

      {/* ---- 08 Next steps ---- */}
      <section id="next">
        <SectionHead number="08" eyebrow="Next steps" headline={doc.nextSteps.headline} intro={doc.nextSteps.intro} />
        <ol className="space-y-2">
          {doc.nextSteps.actions.map((a) => (
            <li key={a.n} className="flex items-start gap-3 rounded-[var(--radius-control)] border border-border/40 px-4 py-3">
              <span className="text-overline text-[var(--color-bb-cobalt)] tabular-nums mt-0.5">
                {String(a.n).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm text-foreground">{a.action}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{a.owner}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted-foreground max-w-[64ch]">{doc.nextSteps.note}</p>
      </section>
    </div>
  );
}
