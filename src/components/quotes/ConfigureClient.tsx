/**
 * Book Now wizard — client-side state holder.
 *
 * The page component hydrates this with the package + catalogues; the
 * customer picks machine, game, capability add-ons, and dates, and we hand
 * off real UUIDs + canonical capability slugs to the checkout page. No
 * client-trusted totals: the configurator displays a price but the server
 * action re-computes the authoritative total at submit time.
 */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EditorialEyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  MachineStep,
  GameStep,
  AddonStep,
  DateStep,
} from "@/components/quotes/ConfiguratorSteps";

export interface PackageForConfig {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  addons: AddonForConfig[];
}

export interface AddonForConfig {
  id: string;
  name: string;
  description?: string;
  price: number;
  capabilitySlug: string;
}

export interface MachineForConfig {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
}

export interface GameForConfig {
  id: string;
  name: string;
  slug: string;
  category: string | null;
}

interface Props {
  pkg: PackageForConfig;
  machines: MachineForConfig[];
  games: GameForConfig[];
  /** Pre-select a machine by slug (e.g. from quiz flow). */
  preSelectedMachine?: string;
  /** Pre-select capability add-ons (capability slugs) carried from the quiz. */
  preSelectedAddons?: string[];
}

const STEPS = ["Machine", "Game", "Add-ons", "Dates"] as const;

export function ConfigureClient({
  pkg,
  machines,
  games,
  preSelectedMachine,
  preSelectedAddons,
}: Props) {
  const router = useRouter();
  const preselectedId = preSelectedMachine
    ? (machines.find((m) => m.slug === preSelectedMachine)?.id ?? "")
    : "";
  const [step, setStep] = useState(preselectedId ? 1 : 0);
  const [machineId, setMachineId] = useState<string>(preselectedId);
  const [gameId, setGameId] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>(
    preSelectedAddons ?? []
  );
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  function toggleAddon(capabilitySlug: string) {
    setSelectedAddons((prev) =>
      prev.includes(capabilitySlug)
        ? prev.filter((s) => s !== capabilitySlug)
        : [...prev, capabilitySlug]
    );
  }

  const addonTotal = useMemo(
    () =>
      pkg.addons
        .filter((a) => selectedAddons.includes(a.capabilitySlug))
        .reduce((sum, a) => sum + a.price, 0),
    [pkg.addons, selectedAddons]
  );
  const displayedTotal = pkg.basePrice + addonTotal;

  function handleContinue() {
    const params = new URLSearchParams({
      package: pkg.id,
      packageSlug: pkg.slug,
      machine: machineId,
      game: gameId,
      addons: selectedAddons.join(","),
      dateStart,
      dateEnd,
    });
    router.push(`/book/checkout?${params.toString()}`);
  }

  const canAdvance =
    (step === 0 && machineId !== "") ||
    (step === 1 && gameId !== "") ||
    step === 2 ||
    (step === 3 && dateStart !== "");

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <EditorialEyebrow accent>
        Book now · Step {step + 1} of {STEPS.length}
      </EditorialEyebrow>
      <h1 className="mt-2 text-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] text-foreground">
        {pkg.name}.
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed">
        A few decisions and you&apos;re booked. We&apos;ll handle everything
        else.
      </p>

      <div className="flex items-center gap-2 my-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step && "bg-foreground text-background",
                i === step && "bg-[hsl(230,93%,53%)] text-white",
                i > step && "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "text-overline hidden sm:block",
                i <= step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-border/60" />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <MachineStep
          machines={machines}
          value={machineId}
          onChange={setMachineId}
        />
      )}
      {step === 1 && (
        <GameStep games={games} value={gameId} onChange={setGameId} />
      )}
      {step === 2 && (
        <AddonStep
          addons={pkg.addons}
          selectedSlugs={selectedAddons}
          onToggle={toggleAddon}
        />
      )}
      {step === 3 && (
        <DateStep
          dateStart={dateStart}
          dateEnd={dateEnd}
          onChangeStart={setDateStart}
          onChangeEnd={setDateEnd}
        />
      )}

      <Separator className="my-6" />
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-foreground">
          Total: £
          {(displayedTotal / 100).toLocaleString("en-GB", {
            minimumFractionDigits: 2,
          })}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleContinue} disabled={!canAdvance}>
              Review &amp; confirm <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
