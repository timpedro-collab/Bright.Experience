/**
 * `render(<Component />)` wrapper that mounts the Sonner toaster and
 * any other providers our client components rely on. Mirrors the
 * provider tree from `src/app/layout.tsx` and `AppShell` at the
 * minimum needed for unit-level tests.
 */

import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { Toaster } from "sonner";
import type { ReactElement, ReactNode } from "react";

function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
