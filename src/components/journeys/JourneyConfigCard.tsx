/** Internal form to configure an event's post-play journey (the follow-up email). */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveJourney } from "@/app/actions/journeys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { JOURNEY_KINDS, type JourneyKind } from "@/lib/validations/journeys";
import type { PostPlayJourney } from "@/lib/queries/journeys";

const KIND_LABELS: Record<JourneyKind, string> = {
  where_to_buy: "Where to buy",
  review: "Review request",
  discount: "Discount offer",
};

export function JourneyConfigCard({
  eventId,
  journey,
}: {
  eventId: string;
  journey: PostPlayJourney | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<JourneyKind>(journey?.kind ?? "where_to_buy");
  const [headline, setHeadline] = useState(journey?.headline ?? "");
  const [body, setBody] = useState(journey?.body ?? "");
  const [ctaLabel, setCtaLabel] = useState(journey?.ctaLabel ?? "");
  const [ctaUrl, setCtaUrl] = useState(journey?.ctaUrl ?? "");
  const [discountCode, setDiscountCode] = useState(journey?.discountCode ?? "");
  const [isActive, setIsActive] = useState(journey?.isActive ?? false);

  function handleSave() {
    startTransition(async () => {
      const result = await saveJourney({
        eventId,
        kind,
        headline,
        body: body || undefined,
        ctaLabel,
        ctaUrl,
        discountCode: discountCode || undefined,
        isActive,
      });
      if (result.success) {
        toast.success(
          isActive
            ? "Journey live — verified leads now get this follow-up"
            : "Journey saved as draft",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Post-play journey</CardTitle>
        <p className="text-sm text-muted-foreground">
          The one-off branded email each verified lead receives the moment
          they play. Internal-only configuration.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="journey-kind">Journey type</Label>
            <NativeSelect
              id="journey-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as JourneyKind)}
            >
              {JOURNEY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="journey-headline">Headline / subject</Label>
            <Input
              id="journey-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Your 10% thank-you code"
              maxLength={120}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="journey-body">Message (optional)</Label>
          <Input
            id="journey-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Thanks for playing at the show — here's what's next."
            maxLength={1000}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="journey-cta-label">Button label</Label>
            <Input
              id="journey-cta-label"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Shop the range"
              maxLength={40}
            />
          </div>
          <div>
            <Label htmlFor="journey-cta-url">Button URL (https)</Label>
            <Input
              id="journey-cta-url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://brand.example/where-to-buy"
              maxLength={500}
            />
          </div>
        </div>
        {kind === "discount" && (
          <div>
            <Label htmlFor="journey-discount">Discount code</Label>
            <Input
              id="journey-discount"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="PLAY10"
              maxLength={40}
            />
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="journey-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="journey-active" className="cursor-pointer">
              {isActive ? "Live — sends on capture" : "Draft — not sending"}
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save journey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
