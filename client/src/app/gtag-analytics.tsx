import Script from "next/script";
import React from "react";

/**
 * Google Analytics (gtag.js) Implementation
 * This component implements the direct Google Analytics gtag.js script
 * as requested by the user.
 */
export const GtagAnalytics = () => {
  const GA_MEASUREMENT_ID = "G-N3959EPWZY";

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
};

/**
 * Hook for Google Analytics tracking
 */
export const useGtagAnalytics = () => {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  };

  const trackPageView = (pagePath: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-N3959EPWZY', {
        page_path: pagePath,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}