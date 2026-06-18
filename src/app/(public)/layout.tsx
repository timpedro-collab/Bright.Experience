/**
 * Public layout — catalog, quiz, book, proposal, partner public surfaces.
 *
 * Delegates all chrome (editorial nav, partner attribution banner, footer) to
 * the shared {@link PublicSiteChrome} so the logged-out landing page and the
 * route-group pages render identical wayfinding from one source of truth.
 */
import { PublicSiteChrome } from "@/components/public/PublicSiteChrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicSiteChrome>{children}</PublicSiteChrome>;
}
