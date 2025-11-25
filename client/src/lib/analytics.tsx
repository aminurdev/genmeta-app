"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";

/**
 * Google Analytics & Tag Manager - Unified Implementation
 * Combines GTM and gtag.js functionality in a single, professional solution
 */

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// TypeScript declarations
declare global {
    interface Window {
        gtag: (command: string, ...args: unknown[]) => void;
        dataLayer: Record<string, unknown>[];
    }
}

/**
 * Analytics Scripts Component
 * Loads both GTM and gtag.js scripts
 */
export function AnalyticsScripts() {
    if (!GTM_ID) {
        if (process.env.NODE_ENV === "development") {
            console.warn("GTM_ID not found in environment variables");
        }
        return null;
    }

    return (
        <>
            {/* Google Tag Manager */}
            <Script
                id="gtm-script"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
                }}
            />

            {/* Google Analytics (gtag.js) */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`}
            />
            <Script
                id="gtag-config"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GTM_ID}', {
              page_path: window.location.pathname,
            });
          `,
                }}
            />
        </>
    );
}

/**
 * GTM NoScript Fallback
 * Required for users with JavaScript disabled
 */
export function AnalyticsNoScript() {
    if (!GTM_ID) return null;

    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
            />
        </noscript>
    );
}

/**
 * Page View Tracker Component
 * Automatically tracks page views on route changes
 */
export function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!GTM_ID || typeof window === "undefined") return;

        // Track with gtag
        if (window.gtag) {
            window.gtag("config", GTM_ID, {
                page_path: pathname,
            });
        }

        // Track with GTM dataLayer
        if (window.dataLayer) {
            window.dataLayer.push({
                event: "page_view",
                page_path: pathname,
                page_title: document.title,
                page_location: window.location.href,
            });
        }
    }, [pathname]);

    return null;
}

/**
 * Analytics Hook
 * Provides methods for tracking events and page views
 */
export function useAnalytics() {
    const trackEvent = useCallback(
        (eventName: string, parameters?: Record<string, unknown>) => {
            if (typeof window === "undefined" || !GTM_ID) return;

            // Track with gtag
            if (window.gtag) {
                window.gtag("event", eventName, parameters);
            }

            // Track with GTM dataLayer
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: eventName,
                    ...parameters,
                });
            }
        },
        []
    );

    const trackPageView = useCallback((pagePath: string) => {
        if (typeof window === "undefined" || !GTM_ID) return;

        // Track with gtag
        if (window.gtag) {
            window.gtag("config", GTM_ID, {
                page_path: pagePath,
            });
        }

        // Track with GTM dataLayer
        if (window.dataLayer) {
            window.dataLayer.push({
                event: "page_view",
                page_path: pagePath,
                page_title: document.title,
                page_location: window.location.href,
            });
        }
    }, []);

    const trackInteraction = useCallback(
        (action: string, category?: string, label?: string, value?: number) => {
            trackEvent("user_interaction", {
                event_category: category || "engagement",
                event_action: action,
                event_label: label,
                value,
            });
        },
        [trackEvent]
    );

    const trackConversion = useCallback(
        (conversionName: string, value?: number, currency?: string) => {
            trackEvent("conversion", {
                conversion_name: conversionName,
                value,
                currency: currency || "USD",
            });
        },
        [trackEvent]
    );

    const trackFormSubmission = useCallback(
        (formName: string, formId?: string) => {
            trackEvent("form_submit", {
                form_name: formName,
                form_id: formId,
            });
        },
        [trackEvent]
    );

    const trackSearch = useCallback(
        (searchTerm: string, resultsCount?: number) => {
            trackEvent("search", {
                search_term: searchTerm,
                results_count: resultsCount,
            });
        },
        [trackEvent]
    );

    const trackLogin = useCallback(
        (method?: string) => {
            trackEvent("login", {
                method: method || "email",
            });
        },
        [trackEvent]
    );

    const trackSignup = useCallback(
        (method?: string) => {
            trackEvent("sign_up", {
                method: method || "email",
            });
        },
        [trackEvent]
    );

    return {
        trackEvent,
        trackPageView,
        trackInteraction,
        trackConversion,
        trackFormSubmission,
        trackSearch,
        trackLogin,
        trackSignup,
    };
}

/**
 * Standalone tracking functions for non-React contexts
 */
export const analytics = {
    trackEvent: (eventName: string, parameters?: Record<string, unknown>) => {
        if (typeof window === "undefined" || !GTM_ID) return;

        if (window.gtag) {
            window.gtag("event", eventName, parameters);
        }

        if (window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...parameters,
            });
        }
    },

    trackPageView: (pagePath: string) => {
        if (typeof window === "undefined" || !GTM_ID) return;

        if (window.gtag) {
            window.gtag("config", GTM_ID, {
                page_path: pagePath,
            });
        }

        if (window.dataLayer) {
            window.dataLayer.push({
                event: "page_view",
                page_path: pagePath,
                page_title: document.title,
                page_location: window.location.href,
            });
        }
    },
};
