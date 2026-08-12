/** Client-side proposal builder with line item editing and send action */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { prepareProposal } from "@/app/actions/quotes";
import { RequestedCapabilities } from "@/components/quotes/RequestedCapabilities";
import { formatMoneyFromPence, formatNumberUS } from "@/lib/currency";
import { timelineLabel } from "@/components/catalog/quiz/quiz-data";
import { referralSourceLabel } from "@/lib/referral-source";
import { Plus, Trash2, Eye, Users, MapPin } from "lucide-react";
import {
  VOLUME_LADDER,
  formatDiscount,
  ladderedFeePence,
} from "@/lib/pricing/volume-ladder";
import { formatGBP } from "@/lib/roi";

interface LineItem { label: string; amount: string; category: string }

const SCOPE_LABELS: Record<string, string> = {
  one_off: "One-off event",
  campaign: "Part of a wider campaign",
  series: "A series of events",
  unsure: "Not sure yet",
};

/** Readable label for the stored engagement-scope code (falls back to legacy budget value). */
function scopeLabel(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  return SCOPE_LABELS[value] ?? value;
}

/** Quiz/intake objective codes → readable goal. Free-text objectives pass through. */
const OBJECTIVE_LABELS: Record<string, string> = {
  sampling: "Sampling & product trial",
  trial: "Sampling & product trial",
  "lead-generation": "Lead generation",
  "lead_generation": "Lead generation",
  leads: "Lead generation",
  "product-launch": "Product launch",
  "brand-awareness": "Brand awareness",
  awareness: "Brand awareness",
  brand: "Brand awareness",
  "brand_lift": "Brand awareness",
  engagement: "Engagement & footfall",
  footfall: "Footfall & engagement",
};

function objectiveLabel(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return OBJECTIVE_LABELS[value] ?? value;
}

/** Trim a stored string field to a clean display value, or null when empty. */
function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

interface ProposalBuilderProps {
  quote: Record<string, unknown>;
}

/** Form for building and sending a proposal with line items. */
export function ProposalBuilder({ quote }: ProposalBuilderProps) {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([{ label: "", amount: "", category: "" }]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function updateItem(i: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, j) => (j === i ? { ...item, [field]: value } : item)));
  }

  const total = items.reduce((sum, li) => sum + (parseInt(li.amount, 10) || 0), 0);

  async function handleSend() {
    setLoading(true);
    const lineItems = items.filter((li) => li.label && li.amount).map((li) => ({
      label: li.label, amount: parseInt(li.amount, 10), category: li.category || undefined,
    }));
    const result = await prepareProposal(quote.id as string, { lineItems, proposalNotes: notes || undefined });
    setLoading(false);
    if (result.success) router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <IntakeDataCard quote={quote} />
        <RequestedCapabilities addons={quote.addons} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setItems((p) => [...p, { label: "", amount: "", category: "" }])}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input value={item.label} onChange={(e) => updateItem(i, "label", e.target.value)} placeholder="Machine hire" />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Amount (¢)</Label>
                  <Input type="number" value={item.amount} onChange={(e) => updateItem(i, "amount", e.target.value)} />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input value={item.category} onChange={(e) => updateItem(i, "category", e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-destructive">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <span>{formatMoneyFromPence(total, { decimals: true })}</span>
            </div>
          </CardContent>
        </Card>

        <VolumeLadderReference baseFeePence={total} />

        <Card>
          <CardHeader><CardTitle className="text-base">Proposal Notes</CardTitle></CardHeader>
          <CardContent>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes for the client…" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </CardContent>
        </Card>

        <Button onClick={handleSend} disabled={loading || items.every((li) => !li.label)} className="w-full" size="lg">
          {loading ? "Sending…" : "Send Proposal"}
        </Button>
      </div>
    </div>
  );
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function IntakeDataCard({ quote }: { quote: Record<string, unknown> }) {
  const reachTrack = (quote.reach_track as string) ?? null;
  const isExperiential = reachTrack === "experiential";
  const impressions = num(quote.estimated_impressions);
  const leads = num(quote.estimated_leads);
  const dooh = num(quote.dooh_media_value);
  const attendees = num(quote.attendees);
  const days = num(quote.activation_days);
  const hasReach = impressions || leads || dooh;
  const referralLabel = referralSourceLabel(quote.referral_source as string);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Customer brief</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Track" value={reachTrack ? (isExperiential ? "Experiential" : "Tradeshow") : String(quote.track)} />
        <Row label="Event type" value={String(quote.event_type ?? "—")} />
        {objectiveLabel(quote.objective) && (
          <Row label="Goal" value={objectiveLabel(quote.objective)!} />
        )}
        {isExperiential ? (
          <>
            <Row label="Location" value={String(quote.activation_location ?? quote.venue_name ?? "—")} />
            <Row label="Days on site" value={days ? `${days} day${days === 1 ? "" : "s"}` : "—"} />
          </>
        ) : (
          <>
            <Row label="Venue" value={String(quote.venue_name ?? "—")} />
            <Row label="Attendees" value={attendees ? formatNumberUS(attendees) : String(quote.footfall_estimate_text ?? "—")} />
          </>
        )}
        <Row label="Postcode" value={String(quote.postcode ?? "—")} />
        <Row label="Dates" value={quote.event_date_start ? `${quote.event_date_start} – ${quote.event_date_end ?? "TBD"}` : "—"} />
        <Row label="Timeline" value={timelineLabel(quote.event_timeline as string) ?? "—"} />
        <Row label="Scope" value={scopeLabel(quote.engagement_scope)} />
        {text(quote.machine_preference) && (
          <Row label="Machine preference" value={text(quote.machine_preference)!} />
        )}
        {text(quote.game_preference) && (
          <Row label="Game preference" value={text(quote.game_preference)!} />
        )}
        {text(quote.creative_needs) && (
          <BlockRow label="Creative direction" value={text(quote.creative_needs)!} />
        )}
        {text(quote.special_requirements) && (
          <BlockRow label="Special requirements" value={text(quote.special_requirements)!} />
        )}

        {hasReach && (
          <>
            <Separator />
            <p className="text-overline text-muted-foreground">Projected reach</p>
            <div className="grid grid-cols-2 gap-2">
              {impressions != null && <ReachStat icon={Eye} value={formatNumberUS(impressions)} label="Impressions" />}
              {leads != null && <ReachStat icon={Users} value={formatNumberUS(leads)} label="Leads" />}
              {dooh != null && <ReachStat icon={MapPin} value={`Up to ${formatMoneyFromPence(dooh)}`} label="DOOH value" />}
            </div>
          </>
        )}

        <Separator />
        <Row label="Contact" value={String(quote.contact_name)} />
        {quote.contact_role ? <Row label="Role" value={String(quote.contact_role)} /> : null}
        <Row label="Email" value={String(quote.contact_email)} />
        <Row label="Phone" value={String(quote.contact_phone ?? "—")} />
        <Row label="Company" value={String(quote.company_name ?? "—")} />
        {referralLabel && (
          <Row label="How they heard about us" value={referralLabel} />
        )}
      </CardContent>
    </Card>
  );
}

function ReachStat({ icon: Icon, value, label }: { icon: typeof Eye; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">
      <Icon size={15} className="shrink-0 text-primary" aria-hidden />
      <span className="min-w-0">
        <span className="block text-sm font-semibold tabular-nums leading-tight text-foreground">{value}</span>
        <span className="block text-[0.6875rem] leading-tight text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

/** Stacked label + free-text value, for longer customer-written fields. */
function BlockRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="block text-muted-foreground">{label}</span>
      <p className="text-foreground leading-snug">{value}</p>
    </div>
  );
}

/** Read-only draft volume ladder for internal quote building. */
function VolumeLadderReference({ baseFeePence }: { baseFeePence: number }) {
  const showFees = baseFeePence > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Volume ladder (draft)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        {VOLUME_LADDER.map((rung) => {
          const line =
            rung.discount === 0
              ? "First activation: list price"
              : `${rung.label}: ${formatDiscount(rung.discount)} off`;
          const fee = showFees
            ? formatGBP(ladderedFeePence(baseFeePence, rung.minEvents) / 100)
            : null;

          return (
            <p key={rung.label} className="text-foreground">
              {line}
              {fee ? (
                <span className="text-muted-foreground"> · {fee}</span>
              ) : null}
            </p>
          );
        })}
        <p className="pt-2 text-xs text-muted-foreground leading-relaxed">
          Placeholder rungs pending sign-off (OWNER-TODO). Quote against them
          directionally, not contractually.
        </p>
      </CardContent>
    </Card>
  );
}
