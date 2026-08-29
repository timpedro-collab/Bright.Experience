/**
 * Shared chrome for legal/static pages.
 *
 * Renders the ridge hero + eyebrow + heading + last-updated date and an
 * always-on "REPLACE BEFORE LAUNCH" banner so the placeholder status of
 * the legal copy is obvious to every internal reviewer. Strike the banner
 * when counsel-approved copy lands (see `STUBS-TO-REPLACE.md`).
 */
import { AlertTriangle } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";
import { formatDateMedium } from "@/lib/dates";

interface Props {
  eyebrow: string;
  title: string;
  /** ISO date string for "Last updated" — pin this when counsel signs off. */
  lastUpdatedIso: string;
  children: React.ReactNode;
  /** Hide the placeholder banner once the page is signed off. */
  approved?: boolean;
}

export function LegalShell({
  eyebrow,
  title,
  lastUpdatedIso,
  children,
  approved = false,
}: Props) {
  const lastUpdated = formatDateMedium(lastUpdatedIso);
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(220px, 26vw, 300px)" }}
        >
          <RidgeArtwork
            seed={`legal::${title.toLowerCase()}`}
            lines={22}
            amplitude={70}
            className="text-bb-cobalt"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container size="md" className="relative pt-16 md:pt-20 pb-10">
          <EditorialEyebrow accent>{eyebrow}</EditorialEyebrow>
          <h1 className="text-display mt-2 text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </Container>
      </section>

      <Section spacing="md">
        <Container size="md">
          {!approved && (
            <aside
              role="status"
              className="mb-8 flex items-start gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-4 text-sm"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-warning">
                <span className="font-semibold uppercase tracking-widest text-xs">
                  Replace before launch
                </span>
                <span className="block mt-1 text-muted-foreground">
                  This is placeholder copy structured for counsel review. The
                  approved version replaces this whole page in Phase 1 of the
                  Path to 10/10 plan.
                </span>
              </p>
            </aside>
          )}
          {/* Theme-aware prose: element colors pinned to semantic tokens so
              legal copy reads correctly on both Ink and Ink Light. */}
          <div className="prose max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-a:text-primary">
            {children}
          </div>
        </Container>
      </Section>
    </>
  );
}
