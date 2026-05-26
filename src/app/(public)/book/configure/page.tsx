/** Track 1 configurator — select machine, game, add-ons, and dates */
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MachineStep, GameStep, AddonStep, DateStep } from "@/components/quotes/ConfiguratorSteps";
import { EditorialEyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";

interface ConfigurePageProps {
  searchParams: Promise<{ package?: string }>;
}

interface PackageData {
  id: string;
  name: string;
  base_price: number;
  package_addons: { id: string; name: string; price: number; description?: string }[];
}

const STEPS = ["Machine", "Game", "Add-ons", "Dates"];

export default function ConfigurePage({ searchParams }: ConfigurePageProps) {
  const { package: pkgSlug } = use(searchParams);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [machine, setMachine] = useState("");
  const [game, setGame] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    if (!pkgSlug) return;
    fetch(`/api/packages/${pkgSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPkg(d))
      .catch(() => {});
  }, [pkgSlug]);

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  const addonTotal = (pkg?.package_addons ?? [])
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (pkg?.base_price ?? 0) + addonTotal;

  function handleContinue() {
    const params = new URLSearchParams({
      package: pkgSlug ?? "", machine, game,
      addons: selectedAddons.join(","), dateStart, dateEnd,
      total: String(totalPrice),
    });
    router.push(`/book/checkout?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <EditorialEyebrow accent>Book now · Step {step + 1} of {STEPS.length}</EditorialEyebrow>
      <h1 className="mt-2 text-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] text-foreground">
        Configure your experience.
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed">
        A few decisions and you&apos;re booked. We&apos;ll handle everything else.
      </p>

      <div className="flex items-center gap-2 my-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              i < step && "bg-foreground text-background",
              i === step && "bg-[hsl(223,94%,53%)] text-white",
              i > step && "bg-muted text-muted-foreground"
            )}>{i + 1}</div>
            <span className={cn(
              "text-overline hidden sm:block",
              i <= step ? "text-foreground" : "text-muted-foreground"
            )}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border/60" />}
          </div>
        ))}
      </div>

      {step === 0 && <MachineStep machine={machine} onChange={setMachine} />}
      {step === 1 && <GameStep game={game} onChange={setGame} />}
      {step === 2 && <AddonStep addons={pkg?.package_addons ?? []} selected={selectedAddons} onToggle={toggleAddon} />}
      {step === 3 && <DateStep dateStart={dateStart} dateEnd={dateEnd} onChangeStart={setDateStart} onChangeEnd={setDateEnd} />}

      <Separator className="my-6" />
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-foreground">
          Total: £{(totalPrice / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={handleContinue}>Continue to Checkout</Button>
          )}
        </div>
      </div>
    </section>
  );
}
