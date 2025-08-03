// Google Tag Manager Utilities

/**
 * GTM Event Types
 */
export interface GTMEvent {
  event: string;
  [key: string]: any;
}

export interface GTMPageView {
  event: 'page_view';
  page_path: string;
  page_title: string;
  page_location: string;
}

export interface GTMCustomEvent {
  event: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  value?: number;
  [key: string]: any;
}

/**
 * GTM Utility Class
 */
class GTMManager {
  private gtmId: string | undefined;
  private isInitialized: boolean = false;

  constructor() {
    this.gtmId = process.env.NEXT_PUBLIC_GTM_ID;
    this.checkInitialization();
  }

  private checkInitialization(): void {
    if (typeof window !== 'undefined') {
      this.isInitialized = !!(window.dataLayer && this.gtmId);
    }
  }

  /**
   * Push event to GTM dataLayer
   */
  private pushToDataLayer(data: GTMEvent): void {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push(data);
    } else {
      console.warn('GTM dataLayer not available');
    }
  }

  /**
   * Track page view
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.isInitialized) return;

    this.pushToDataLayer({
      event: 'page_view',
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    if (!this.isInitialized) return;

    this.pushToDataLayer({
      event: eventName,
      ...parameters,
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(action: string, category?: string, label?: string, value?: number): void {
    this.trackEvent('user_interaction', {
      event_category: category || 'engagement',
      event_action: action,
      event_label: label,
      value,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(conversionName: string, value?: number, currency?: string): void {
    this.trackEvent('conversion', {
      conversion_name: conversionName,
      value,
      currency: currency || 'USD',
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string, formId?: string): void {
    this.trackEvent('form_submit', {
      form_name: formName,
      form_id: formId,
    });
  }

  /**
   * Track file download
   */
  trackDownload(fileName: string, fileType?: string): void {
    this.trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType,
    });
  }

  /**
   * Track external link click
   */
  trackExternalLink(url: string, linkText?: string): void {
    this.trackEvent('click', {
      event_category: 'outbound',
      event_action: 'click',
      event_label: url,
      link_text: linkText,
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm: string, resultsCount?: number): void {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  /**
   * Track user login
   */
  trackLogin(method?: string): void {
    this.trackEvent('login', {
      method: method || 'email',
    });
  }

  /**
   * Track user signup
   */
  trackSignup(method?: string): void {
    this.trackEvent('sign_up', {
      method: method || 'email',
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) return;

    this.pushToDataLayer({
      event: 'user_properties',
      ...properties,
    });
  }

  /**
   * Get GTM ID
   */
  getGTMId(): string | undefined {
    return this.gtmId;
  }

  /**
   * Check if GTM is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const gtm = new GTMManager();

// Export singleton instance and utility functions
export default gtm;

// Export individual functions for convenience
export const trackPageView = (pagePath: string, pageTitle?: string) => 
  gtm.trackPageView(pagePath, pageTitle);

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => 
  gtm.trackEvent(eventName, parameters);

export const trackInteraction = (action: string, category?: string, label?: string, value?: number) => 
  gtm.trackInteraction(action, category, label, value);

export const trackConversion = (conversionName: string, value?: number, currency?: string) => 
  gtm.trackConversion(conversionName, value, currency);

export const trackFormSubmission = (formName: string, formId?: string) => 
  gtm.trackFormSubmission(formName, formId);

export const trackDownload = (fileName: string, fileType?: string) => 
  gtm.trackDownload(fileName, fileType);

export const trackExternalLink = (url: string, linkText?: string) => 
  gtm.trackExternalLink(url, linkText);

export const trackSearch = (searchTerm: string, resultsCount?: number) => 
  gtm.trackSearch(searchTerm, resultsCount);

export const trackLogin = (method?: string) => 
  gtm.trackLogin(method);

export const trackSignup = (method?: string) => 
  gtm.trackSignup(method);

export const setUserProperties = (properties: Record<string, any>) => 
  gtm.setUserProperties(properties);

// Export GTM Manager class for advanced usage
export { GTMManager };