/** Persistent partner attribution banner for the public funnel */
import { cookies } from "next/headers";
import Link from "next/link";
import { X } from "lucide-react";

import { Container } from "@/components/ui/section";
import { PartnerCoBrand } from "@/components/public/PartnerCoBrand";
import { getPartnerByCode } from "@/lib/queries/partners";

export async function PartnerAttributionBanner() {
  const cookieStore = await cookies();
  const code = cookieStore.get("bb_partner")?.value;
  if (!code) return null;

  const partner = await getPartnerByCode(code);
  if (!partner) return null;

  return (
    <div className="border-b border-primary/20 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-bb-cobalt)_18%,transparent),color-mix(in_srgb,var(--color-bb-cyan)_8%,transparent))] backdrop-blur-md">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <PartnerCoBrand
            name={partner.name}
            logoUrl={partner.logo_url}
            accent={partner.brand_color}
            variant="mark"
            size="sm"
          />
          <span className="truncate text-sm text-foreground">
            You&apos;re browsing with{" "}
            <strong className="text-foreground">{partner.name}</strong>{" "}
            — they&apos;ll receive credit for any booking you make.
          </span>
        </div>
        <Link
          href="/p/clear"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" /> Browse without
        </Link>
      </Container>
    </div>
  );
}
