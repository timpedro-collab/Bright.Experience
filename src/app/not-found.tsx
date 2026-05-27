import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
} from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Not found" }]}
      />

      <RidgeHero
        seed="not-found"
        eyebrow="404"
        title="Page not found."
        subtitle="The page you're looking for doesn't exist or has been moved."
      />

      <EditionBody>
        <section className="py-16 flex flex-col items-center text-center">
          <p className="text-sm text-muted-foreground max-w-md mb-8">
            If you followed a link from within the portal, this might be a
            permissions issue. Otherwise, head back to the home page.
          </p>
          <Button asChild variant="brand">
            <Link href="/">
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </Button>
        </section>
      </EditionBody>

      <EditionFooter />
    </EditionShell>
  );
}
