"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useCallback, useState, useRef } from "react";

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
 * Detects whether the current environment is a search engine bot, crawler,
 * or automated testing environment (e.g. Google Search Console inspection / Googlebot).
 * Prevents tracking requests from running and causing aborted network warnings in GSC.
 */
export function isBot(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
        return false;
    }
    const ua = navigator.userAgent || "";
    return (
        /bot|googlebot|crawler|spider|robot|crawling|google-inspectiontool|lighthouse|headless/i.test(
            ua
        ) || Boolean(navigator.webdriver)
    );
}

/**
 * Analytics Scripts Component
 * Loads GTM or gtag.js scripts only for real visitors, avoiding bot errors in Google Search Console.
 */
export function AnalyticsScripts() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        if (!GTM_ID) return;

        // Skip loading tracking scripts for search engine crawlers and automated bots
        if (isBot()) {
            return;
        }

        setShouldLoad(true);
    }, []);

    if (!shouldLoad || !GTM_ID) {
        if (!GTM_ID && process.env.NODE_ENV === "development") {
            console.warn("GTM_ID not found in environment variables");
        }
        return null;
    }

    const isGTM = GTM_ID.startsWith("GTM-");

    return (
        <>
            {isGTM ? (
                /* Google Tag Manager (for container IDs starting with GTM-) */
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
            ) : (
                /* Google Analytics 4 (gtag.js for Measurement IDs starting with G-) */
                <>
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
            )}
        </>
    );
}

/**
 * GTM NoScript Fallback
 * Required for users with JavaScript disabled (only applicable for GTM containers)
 */
export function AnalyticsNoScript() {
    if (!GTM_ID || !GTM_ID.startsWith("GTM-")) return null;

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
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!GTM_ID || typeof window === "undefined" || isBot()) return;

        // Skip initial render as the initial page view is handled by script initialization
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

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
            if (typeof window === "undefined" || !GTM_ID || isBot()) return;

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
        if (typeof window === "undefined" || !GTM_ID || isBot()) return;

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
        if (typeof window === "undefined" || !GTM_ID || isBot()) return;

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
        if (typeof window === "undefined" || !GTM_ID || isBot()) return;

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
