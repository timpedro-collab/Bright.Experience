/**
 * The merged public homepage at `/` for logged-out visitors — one canonical
 * marketing surface combining the bright.blue/events story (pillars, turnkey
 * platform, Cloud) with the portal's catalog (machines, case studies, quiz).
 *
 * Section order follows the sales sequence: claim → trust → jobs → product →
 * proof → capability → process → ask. Copy and numbers come from
 * `src/lib/marketing/claims.ts`.
 */
import { PublicSiteChrome } from "@/components/public/PublicSiteChrome";
import { HeroSection } from "@/components/public/landing/HeroSection";
import { LogosStrip } from "@/components/catalog/LogosStrip";
import { PillarsSection } from "@/components/public/landing/PillarsSection";
import { MachinesShowcase } from "@/components/public/landing/MachinesShowcase";
import { ProofSection } from "@/components/public/landing/ProofSection";
import { PlatformSection } from "@/components/public/landing/PlatformSection";
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
    <PublicSiteChrome>
      <HeroSection />
      <LogosStrip overline="Trusted by Leading Brands" logos={CLIENT_LOGOS} />
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
      <HowItWorks />
      <FinalCta />
    </PublicSiteChrome>
  );
}
