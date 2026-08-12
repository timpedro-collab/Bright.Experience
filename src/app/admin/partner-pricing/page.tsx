/**
 * Internal partner-pricing microsite management.
 *
 * Commercial users mint unlisted `/pp/:slug` pages for prospect deals,
 * each carrying a JSON deal config the buyer explores on the public surface.
 */
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getPartnerPricingPagesForAdmin,
  type PartnerPricingPage,
  type PartnerPricingPageStatus,
} from "@/lib/queries/partner-pricing";

import { CopyablePageLink } from "./CopyablePageLink";
import { NewPartnerPricingPageForm } from "./NewPartnerPricingPageForm";
import { RevokePageButton } from "./RevokePageButton";

export const metadata = {
  title: "Partner pricing pages",
};

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadgeVariant(
  status: PartnerPricingPageStatus,
): "default" | "secondary" | "outline" {
  if (status === "live") return "default";
  if (status === "draft") return "secondary";
  return "outline";
}

export default async function AdminPartnerPricingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [pages, unread] = await Promise.all([
    getPartnerPricingPagesForAdmin(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Deals"
      title="Partner pricing pages"
      subtitle="Unlisted deal microsites, one per prospect. The slug is the credential — share the full link only with the deal team."
      heroRight={
        pages.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-base font-semibold text-foreground">{pages.length}</span>{" "}
            page{pages.length === 1 ? "" : "s"}
          </div>
        ) : null
      }
    >
      <div className="space-y-8 py-8">
        <Card>
          <CardContent className="p-5">
            <NewPartnerPricingPageForm />
          </CardContent>
        </Card>

        {pages.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No pages yet"
            description="Create a page above to mint an unlisted link for a prospect deal."
          />
        ) : (
          <section>
            <EditorialEyebrow>Pages</EditorialEyebrow>
            <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Partner</TableHead>
                    <TableHead className="text-muted-foreground">Show</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground">Link</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <PageRow key={page.id} page={page} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}

function PageRow({ page }: { page: PartnerPricingPage }) {
  return (
    <TableRow className="border-border/60">
      <TableCell className="font-medium text-foreground">{page.partnerName}</TableCell>
      <TableCell className="text-muted-foreground">{page.showLabel}</TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(page.status)} className="text-[0.65rem] capitalize">
          {page.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {formatCreatedAt(page.createdAt)}
      </TableCell>
      <TableCell>
        <CopyablePageLink slug={page.slug} />
      </TableCell>
      <TableCell className="text-right">
        {page.status === "live" ? <RevokePageButton pageId={page.id} /> : null}
      </TableCell>
    </TableRow>
  );
}
