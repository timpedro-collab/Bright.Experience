/** Mobile drawer navigation for public surfaces */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLockup } from "@/components/ui/brand-mark";

interface PublicMobileMenuProps {
  links: { label: string; href: string }[];
}

export function PublicMobileMenu({ links }: PublicMobileMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="glass"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] border-white/10 bg-background/95 backdrop-blur-2xl">
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <BrandLockup />
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-control)] px-3 py-2.5 text-base font-medium text-foreground/90 hover:bg-white/[0.04] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
            <Button asChild variant="glass" className="justify-center">
              <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
            </Button>
            <Button asChild variant="brand" className="justify-center">
              <Link href="/quiz" onClick={() => setOpen(false)}>Find your fit</Link>
            </Button>
            <Link
              href="/partners/join"
              onClick={() => setOpen(false)}
              className="mt-2 text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Become a partner
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
