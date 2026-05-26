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
import { Plus, Trash2 } from "lucide-react";

interface LineItem { label: string; amount: string; category: string }

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
                  <Label className="text-xs">Amount (p)</Label>
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
              <span>£{(total / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

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

function IntakeDataCard({ quote }: { quote: Record<string, unknown> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Intake Data</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Track" value={String(quote.track)} />
        <Row label="Event Type" value={String(quote.event_type ?? "—")} />
        <Row label="Venue" value={String(quote.venue_name ?? "—")} />
        <Row label="Postcode" value={String(quote.postcode ?? "—")} />
        <Row label="Dates" value={quote.event_date_start ? `${quote.event_date_start} – ${quote.event_date_end ?? "TBD"}` : "—"} />
        <Row label="Machine" value={String(quote.machine_preference ?? "—")} />
        <Row label="Game" value={String(quote.game_preference ?? "—")} />
        <Row
          label="Footfall"
          value={String(
            quote.footfall_estimate_text ?? quote.footfall_estimate ?? "—"
          )}
        />
        <Row label="Creative" value={String(quote.creative_needs ?? "—")} />
        <Row label="Budget" value={String(quote.budget_indication ?? "—")} />
        <Separator />
        <Row label="Contact" value={String(quote.contact_name)} />
        <Row label="Email" value={String(quote.contact_email)} />
        <Row label="Phone" value={String(quote.contact_phone ?? "—")} />
        <Row label="Company" value={String(quote.company_name ?? "—")} />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
