/** Studio service tier card — animated pricing tile that flips to a request form */
"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudioRequestForm } from "./StudioRequestForm";
import type { StudioServiceType } from "@/types";

export interface StudioTier {
  id: string;
  serviceType: StudioServiceType;
  name: string;
  subtitle: string;
  price: string;
  priceUnit: string;
  features: string[];
  featured?: boolean;
}

export function StudioTierCard({
  tier,
  eventId,
  index,
}: {
  tier: StudioTier;
  eventId: string;
  index: number;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card
      tone="subtle"
      className={cn(
        "stagger-item flex flex-col relative p-6",
        tier.featured &&
          "border-primary/30 bg-[linear-gradient(180deg,hsl(223,94%,53%,0.06),transparent_60%)]"
      )}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <StudioRequestForm
              eventId={eventId}
              serviceType={tier.serviceType}
              defaultTitle={tier.name}
              tierPrice={tier.price}
              onClose={() => setShowForm(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1"
          >
            <div className="flex-1">
              <h3 className="text-heading text-base font-bold text-foreground mb-1">
                {tier.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-5">{tier.subtitle}</p>

              <ul className="space-y-2.5 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <div className="text-center mb-4">
                <span className="text-heading text-2xl font-bold text-foreground">
                  {tier.price}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {tier.priceUnit}
                </span>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                variant={tier.featured ? "brand" : "outline"}
                className="w-full"
              >
                Get started
                <ArrowRight size={14} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
