"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import gtm, { trackPageView, trackEvent } from "@/lib/gtm";

// GTM Analytics Hook
export function useGTMAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    trackPageView(pathname);
  }, [pathname]);

  // Return GTM utility functions
  return {
    trackEvent,
    trackPageView: (pagePath?: string) => trackPageView(pagePath || pathname),
    gtm, // Expose full GTM manager for advanced usage
  };
}

// Analytics Component
export function Analytics() {
  useGTMAnalytics();
  return null;
}

// GTM NoScript fallback component
export function GTMNoScript() {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
  
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
