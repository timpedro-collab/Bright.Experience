"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, Save, Loader2, CheckCircle2, Type, FileUp } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandColorsField, parseColors } from "@/components/briefing/BrandColorsField";
import { saveBrandKit, type BrandKit } from "@/app/actions/briefing";

interface BrandKitCardProps {
  eventId: string;
  kit: BrandKit;
  /** Customers fill this in; internal staff see it read-only. */
  canEdit: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";

export function BrandKitCard({ eventId, kit, canEdit }: BrandKitCardProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [colors, setColors] = useState(kit.colors);
  const [fontHeading, setFontHeading] = useState(kit.fontHeading);
  const [fontBody, setFontBody] = useState(kit.fontBody);
  const [usageDo, setUsageDo] = useState(kit.usageDo);
  const [usageDont, setUsageDont] = useState(kit.usageDont);

  const hasAny =
    [kit.colors, kit.fontHeading, kit.fontBody, kit.usageDo, kit.usageDont].some(
      (v) => v.trim().length > 0
    );

  function handleSave() {
    startSave(async () => {
      const result = await saveBrandKit(eventId, {
        colors,
        fontHeading,
        fontBody,
        usageDo,
        usageDont,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Brand kit saved", {
        description: "Your colours and fonts are now with the creative team.",
      });
      router.refresh();
    });
  }

  // Read-only view (internal staff, or anyone without edit rights).
  if (!canEdit) {
    return (
      <Card tone="subtle" className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Palette size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Brand kit</h3>
          {hasAny && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Provided
            </span>
          )}
        </div>
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">
            The customer hasn&apos;t shared their brand colours or fonts yet.
          </p>
        ) : (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-overline text-muted-foreground mb-1.5">Brand colours</dt>
              <dd>
                <BrandColorsField value={kit.colors} onChange={() => {}} readOnly />
              </dd>
            </div>
            {(kit.fontHeading || kit.fontBody) && (
              <div>
                <dt className="text-overline text-muted-foreground mb-1">Fonts</dt>
                <dd className="text-foreground">
                  {kit.fontHeading && <span>Headings: {kit.fontHeading}</span>}
                  {kit.fontHeading && kit.fontBody && <span> · </span>}
                  {kit.fontBody && <span>Body: {kit.fontBody}</span>}
                </dd>
              </div>
            )}
            {usageDo && (
              <div>
                <dt className="text-overline text-muted-foreground mb-1">Please do</dt>
                <dd className="text-foreground whitespace-pre-line">{kit.usageDo}</dd>
              </div>
            )}
            {usageDont && (
              <div>
                <dt className="text-overline text-muted-foreground mb-1">Please avoid</dt>
                <dd className="text-foreground whitespace-pre-line">{kit.usageDont}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Palette size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Brand kit</h3>
          {hasAny && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-[60ch]">
          Tell us your colours and fonts so we stay on-brand — no need to dig out
          a guidelines PDF. {parseColors(colors).length > 0 ? "" : "Use the picker or paste hex codes."}
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Brand colours
        </label>
        <BrandColorsField value={colors} onChange={setColors} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <Type size={12} /> Heading font
          </label>
          <input
            value={fontHeading}
            onChange={(e) => setFontHeading(e.target.value)}
            placeholder="e.g. Montserrat Bold"
            className={inputClass}
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <Type size={12} /> Body font
          </label>
          <input
            value={fontBody}
            onChange={(e) => setFontBody(e.target.value)}
            placeholder="e.g. Inter Regular"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Please do <span className="font-normal">(optional)</span>
          </label>
          <textarea
            value={usageDo}
            onChange={(e) => setUsageDo(e.target.value)}
            placeholder="Use the logo with clear space around it…"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Please avoid <span className="font-normal">(optional)</span>
          </label>
          <textarea
            value={usageDont}
            onChange={(e) => setUsageDont(e.target.value)}
            placeholder="Don't stretch the logo or recolour it…"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileUp size={13} className="mt-0.5 shrink-0" />
        Already have a full brand guidelines document? You can still attach it
        with your uploads below — these fields just mean you don&apos;t have to.
      </p>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : hasAny ? "Update brand kit" : "Save brand kit"}
        </Button>
      </div>
    </Card>
  );
}
