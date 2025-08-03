"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useGtagAnalytics } from "./gtag-analytics";

/**
 * Google Analytics Page Tracker
 * Automatically tracks page views when the route changes
 */
export function GtagPageTracker() {
  const pathname = usePathname();
  const { trackPageView } = useGtagAnalytics();

  useEffect(() => {
    // Track page view on route change
    trackPageView(pathname);
  }, [pathname, trackPageView]);

  return null;
}