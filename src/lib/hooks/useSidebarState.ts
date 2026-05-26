/** Sidebar collapse persistence — localStorage-backed, SSR-safe */
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bb:sidebar-collapsed";

export function useSidebarState() {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from localStorage; we must sync the persisted value into state on mount
        setCollapsedState(true);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  function setCollapsed(next: boolean) {
    setCollapsedState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    setCollapsed(!collapsed);
  }

  return { collapsed, setCollapsed, toggle, hydrated };
}
