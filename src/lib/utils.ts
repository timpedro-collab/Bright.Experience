/** Shared utility functions — className composition and helpers */
import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * A Tailwind-aware className merger that knows about our custom design
 * tokens. Without the override, `tailwind-merge` heuristically treats
 * any `text-*` utility as a text-color and dedupes them — which strips
 * out our typography mixins like `.text-overline`, `.text-heading`,
 * `.text-display`, `.text-body`, and `.text-balance` whenever they are
 * combined with a real text-color utility. Registering them as their
 * own conflict group teaches `tailwind-merge` to leave them alone.
 *
 * We declare the custom group via a generic type parameter so the
 * resulting merger is properly typed and survives `tsc --noEmit`.
 */
const twMerge = extendTailwindMerge<"bb-text-mixin">({
  extend: {
    classGroups: {
      "bb-text-mixin": [
        "text-overline",
        "text-heading",
        "text-display",
        "text-body",
        "text-balance",
      ],
    },
  },
});

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
