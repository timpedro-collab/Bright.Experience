/**
 * The merged public homepage at `/` for logged-out visitors — one canonical
 * marketing surface combining the bright.blue/events story (pillars, turnkey
 * platform, Cloud) with the portal's catalog (machines, case studies, quiz).
 *
 * Section order follows the sales sequence: claim → trust → self-selection
 * ("Let's plan ___") → jobs → product → proof → capability → network story
 * (role doors for venues/organizers) → process → ask.
 * Copy and numbers come from `src/lib/marketing/claims.ts`.
 */
import { PublicSiteChrome } from "@/components/public/PublicSiteChrome";
import { HeroSection } from "@/components/public/landing/HeroSection";
import { LogosStrip } from "@/components/catalog/LogosStrip";
import { LetsPlanSection } from "@/components/public/landing/LetsPlanSection";
import { PillarsSection } from "@/components/public/landing/PillarsSection";
import { MachinesShowcase } from "@/components/public/landing/MachinesShowcase";
import { ProofSection } from "@/components/public/landing/ProofSection";
import { PlatformSection } from "@/components/public/landing/PlatformSection";
import { NetworkSection } from "@/components/public/landing/NetworkSection";
import { HowItWorks } from "@/components/catalog/HowItWorks";
import { FinalCta } from "@/components/public/landing/FinalCta";
import { CLIENT_LOGOS } from "@/lib/marketing/client-logos";

import { getMachines } from "@/lib/queries/machines";
import { getCaseStudies } from "@/lib/queries/case-studies";

export async function PublicLanding() {
  const [machines, caseStudies] = await Promise.all([
    getMachines(),
    getCaseStudies(),
  ]);

  return (
    /* Ink is the app default now, so the landing follows the user's theme —
       the old force-dark `.theme-dark` wrapper is gone. The footer keeps its
       own force-Ink scope inside PublicSiteChrome. */
    <PublicSiteChrome>
      <HeroSection />
      <LogosStrip overline="Trusted by Leading Brands" logos={CLIENT_LOGOS} />
      <LetsPlanSection />
      <PillarsSection />
      <MachinesShowcase
        machines={machines.map((m) => ({
          name: m.name,
          slug: m.slug,
          tagline: m.tagline ?? undefined,
          heroImageUrl: m.hero_image_url,
        }))}
      />
      <ProofSection
        caseStudies={caseStudies.map((cs) => ({
          title: cs.title,
          slug: cs.slug,
          clientName: cs.client_name ?? undefined,
          location: cs.location ?? undefined,
          heroImageUrl: cs.hero_image_url ?? undefined,
          statsJson: (cs.stats_json as Record<string, unknown>) ?? undefined,
        }))}
      />
      <PlatformSection />
      <NetworkSection />
      <HowItWorks />
      <FinalCta />
    </PublicSiteChrome>
  );
}
