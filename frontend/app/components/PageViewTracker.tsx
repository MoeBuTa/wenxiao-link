"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { recordHit } from "../lib/stats";

// Records one page view per client-side navigation. Mounted globally; renders
// nothing. The ref dedupes React's double-effect (dev strict mode) and any
// re-render that doesn't change the path.
export function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    recordHit(pathname);
  }, [pathname]);

  return null;
}
