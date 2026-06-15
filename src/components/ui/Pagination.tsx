/** URL-based pagination control — SEO-friendly <Link> navigation. */
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Base path without query string, e.g. "/admin/partners". */
  basePath: string;
}

function pageHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/**
 * Build the set of page numbers to render, with `null` for ellipsis gaps.
 * Always shows first, last, current, and one neighbour on each side.
 */
function pageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push(null);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push(null);
  pages.push(total);
  return pages;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageRange(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 py-6">
      <Link
        href={pageHref(basePath, currentPage - 1)}
        aria-disabled={currentPage <= 1}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors",
          currentPage <= 1
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent hover:text-foreground",
        )}
      >
        <ChevronLeft className="size-4" />
        <span className="sr-only">Previous page</span>
      </Link>

      {pages.map((page, i) =>
        page === null ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground select-none">
            &hellip;
          </span>
        ) : (
          <Link
            key={page}
            href={pageHref(basePath, page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-[var(--radius-control)] text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-[var(--color-bb-cobalt)] text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {page}
          </Link>
        ),
      )}

      <Link
        href={pageHref(basePath, currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors",
          currentPage >= totalPages
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent hover:text-foreground",
        )}
      >
        <ChevronRight className="size-4" />
        <span className="sr-only">Next page</span>
      </Link>
    </nav>
  );
}
