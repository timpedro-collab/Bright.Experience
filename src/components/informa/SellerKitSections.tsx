/**
 * Presentational sections of the Informa seller's kit: the rep script,
 * qualifying questions, what the sponsor gets, objection handling and the
 * deal flow. The interactive configurator lives in PlacementConfigurator.
 * All copy comes from `@/lib/informa/content`.
 */
import { Check } from "lucide-react";

import {
  DEAL_FLOW,
  OBJECTIONS,
  QUALIFYING_QUESTIONS,
  REP_SCRIPT,
  SPONSOR_GETS,
} from "@/lib/informa/content";

export function KitSection({
  overline,
  title,
  children,
}: {
  overline: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/60 py-14">
      <p className="text-overline text-brand-cyan">{overline}</p>
      <h2 className="text-display-grotesk mt-2 text-3xl sm:text-4xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function RepScript() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {REP_SCRIPT.map((b, i) => (
        <div key={b.beat} className="rounded-2xl border border-border/70 bg-card/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {String(i + 1).padStart(2, "0")} · {b.beat}
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            &ldquo;{b.script}&rdquo;
          </p>
        </div>
      ))}
    </div>
  );
}

export function QualifyingQuestions() {
  return (
    <ol className="space-y-4">
      {QUALIFYING_QUESTIONS.map((q, i) => (
        <li key={q.question} className="rounded-2xl border border-border/70 bg-card/50 p-6">
          <p className="text-lg font-semibold">
            {i + 1}. {q.question}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{q.why}</p>
        </li>
      ))}
    </ol>
  );
}

export function SponsorGets() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {SPONSOR_GETS.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-cyan" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ObjectionCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {OBJECTIONS.map((o) => (
        <div key={o.objection} className="rounded-2xl border border-border/70 bg-card/50 p-6">
          <p className="font-semibold">&ldquo;{o.objection}&rdquo;</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.answer}</p>
        </div>
      ))}
    </div>
  );
}

export function DealFlowSteps() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {DEAL_FLOW.map((s, i) => (
        <li key={s.step} className="rounded-2xl border border-border/70 bg-card/50 p-6">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {i + 1}
          </span>
          <h3 className="mt-3 font-semibold">{s.step}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
        </li>
      ))}
    </ol>
  );
}
