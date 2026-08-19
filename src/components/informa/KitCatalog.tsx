/**
 * The kit's catalogue block: product family, rate card, and the live
 * configurator, wired together so "Price this in the configurator" on a
 * product presets the price lever and scrolls the rep straight to it.
 */
"use client";

import { useRef, useState } from "react";

import { PlacementConfigurator } from "@/components/informa/PlacementConfigurator";
import { ProductFamily } from "@/components/informa/ProductFamily";
import { RateCard } from "@/components/informa/RateCard";
import { KitSection } from "@/components/informa/SellerKitSections";

export function KitCatalog() {
  const [preset, setPreset] = useState<{ price: number; seq: number } | null>(null);
  const configuratorRef = useRef<HTMLDivElement>(null);

  const priceProduct = (price: number) => {
    setPreset((p) => ({ price, seq: (p?.seq ?? 0) + 1 }));
    configuratorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <KitSection overline="Sell these" title="Five products for your rate card">
        <ProductFamily onPriceProduct={priceProduct} />
        <div className="mt-10">
          <RateCard />
        </div>
      </KitSection>

      <div ref={configuratorRef} className="scroll-mt-6">
        <KitSection
          overline="Show this"
          title="Price a placement live, in the meeting"
        >
          <PlacementConfigurator
            presetPrice={preset?.price}
            presetSeq={preset?.seq}
          />
        </KitSection>
      </div>
    </>
  );
}
