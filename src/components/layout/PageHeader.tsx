/** Page header — breadcrumbs, title, supporting metadata, primary actions */
import * as React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  eyebrow?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight size={13} className="text-muted-foreground/60" aria-hidden />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-xs text-foreground/80" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-overline text-muted-foreground mb-2">{eyebrow}</p>
          )}
          {typeof title === "string" ? (
            <h1 className="text-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            <div className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {subtitle}
            </div>
          )}
          {meta && <div className="mt-4 flex flex-wrap gap-2">{meta}</div>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:gap-3">{actions}</div>
        )}
      </div>
    </header>
  );
}
