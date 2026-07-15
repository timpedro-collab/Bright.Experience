/** Partner sales collateral and resources library */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PortalPageShell, partnerTabs } from "@/components/brand";
import { PartnerResourceCard } from "@/components/partners/PartnerResourceCard";

interface ResourcesPageProps {
  params: Promise<{ slug: string }>;
}

interface ResourceItem {
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  viewInBrowser?: boolean;
}

const RESOURCES: ResourceItem[] = [
  {
    title: "Bright.Blue Partner Pitch Deck",
    description: "Comprehensive sales presentation covering our technology, case studies, and partnership benefits.",
    category: "pitch-deck",
    fileUrl: "/api/partner-resources/pitch-deck",
  },
  {
    title: "Vending Machine Product Sheet",
    description: "Technical specifications and engagement metrics for our interactive vending machines.",
    category: "product-sheet",
    fileUrl: "/api/partner-resources/vending-product-sheet",
  },
  {
    title: "Activation Machine Product Sheet",
    description: "Overview of activation machine capabilities, game library, and customisation options.",
    category: "product-sheet",
    fileUrl: "/api/partner-resources/activation-product-sheet",
  },
  {
    title: "Client Case Study — Costa Coffee (Catch-A-Matcha)",
    description: "A gamified sampling roadshow across ten UK city centres — 3,270 plays, 200K+ impressions, and a 100% marketing opt-in rate.",
    category: "case-study",
    fileUrl: "/resources/costa-catch-a-matcha-case-study.html",
    viewInBrowser: true,
  },
  {
    title: "Brand Guidelines & Logos",
    description: "Bright.Blue brand assets, co-branding guidelines, and approved logo variations.",
    category: "branding",
    fileUrl: "/api/partner-resources/brand-guidelines",
  },
  {
    title: "Product Demo Reel",
    description: "90-second video showcasing our machines and games in action at live events.",
    category: "video",
    fileUrl: "/api/partner-resources/demo-reel",
  },
];

export default async function PartnerResourcesPage({ params }: ResourcesPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const unread = await getUnreadCount(user.id);
  const partnerName = String(partner.name ?? "Partner");

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Resources"
      slug={slug}
      tabs={partnerTabs(slug, user.role)}
      title="Resources"
      subtitle="Sales collateral, product sheets, and brand assets"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {RESOURCES.map((resource) => (
          <PartnerResourceCard
            key={resource.title}
            title={resource.title}
            description={resource.description}
            fileUrl={resource.fileUrl}
            category={resource.category}
            viewInBrowser={resource.viewInBrowser}
          />
        ))}
      </div>
    </PortalPageShell>
  );
}
