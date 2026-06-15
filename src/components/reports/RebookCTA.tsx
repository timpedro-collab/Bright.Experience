/** Rebook CTA card — prompts users to re-run the same activation with pre-filled booking */
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight } from "lucide-react";

interface RebookCTAProps {
  eventType?: string;
  machineSlug?: string;
  gameSlug?: string;
}

/** Builds booking URL with pre-filled query params from the current event */
function buildBookingUrl({
  eventType,
  machineSlug,
  gameSlug,
}: RebookCTAProps): string {
  const params = new URLSearchParams();
  if (machineSlug) params.set("machine", machineSlug);
  if (gameSlug) params.set("game", gameSlug);
  if (eventType) params.set("type", eventType);
  const qs = params.toString();
  return `/book/configure${qs ? `?${qs}` : ""}`;
}

/** Renders a gradient-bordered CTA card prompting re-booking with the same configuration */
export function RebookCTA(props: RebookCTAProps) {
  const href = buildBookingUrl(props);

  return (
    <div className="relative rounded-[var(--radius-card)] p-[1px] bg-gradient-to-br from-brand via-brand-soft to-brand">
      <Card className="rounded-[var(--radius-card)] border-0 bg-card-dark">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 border border-brand/15">
              <RotateCcw size={18} className="text-brand" />
            </div>
            <div>
              <p className="text-heading text-sm font-semibold text-foreground">
                Run this again?
              </p>
              <p className="text-xs text-muted-foreground">
                Same setup, new venue or date
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Loved the results? Book the same activation at another location or
            date — your configuration is ready to go.
          </p>

          <Button asChild variant="brand" className="w-full group">
            <Link href={href}>
              Rebook This Activation
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
