# Google Tag Manager (GTM) Integration Guide

This document explains how to use the professional GTM integration in the GenMeta application.

## Setup

### 1. Environment Configuration

Create a `.env.local` file in the client directory with your GTM Container ID:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 2. GTM Container Setup

In your Google Tag Manager container, configure the following:

1. **Built-in Variables**: Enable all Page variables and Click variables
2. **Custom Events**: Set up triggers for the events you want to track
3. **Google Analytics 4**: Configure GA4 tags if needed

## Usage

### Basic Page Tracking

Page views are automatically tracked when users navigate between pages. No additional code is required.

### Custom Event Tracking

#### Using the Hook

```tsx
import { useGTMAnalytics } from '@/app/analytics';

function MyComponent() {
  const { trackEvent } = useGTMAnalytics();

  const handleButtonClick = () => {
    trackEvent('button_click', {
      button_name: 'cta_button',
      section: 'hero'
    });
  };

  return <button onClick={handleButtonClick}>Click Me</button>;
}
```

#### Using GTM Utilities Directly

```tsx
import { trackEvent, trackConversion, trackFormSubmission } from '@/lib/gtm';

// Track custom event
trackEvent('custom_event', { custom_parameter: 'value' });

// Track conversion
trackConversion('purchase', 99.99, 'USD');

// Track form submission
trackFormSubmission('contact_form', 'contact-form-id');
```

### Available Tracking Functions

#### Core Functions
- `trackPageView(pagePath, pageTitle?)` - Track page views
- `trackEvent(eventName, parameters?)` - Track custom events
- `trackInteraction(action, category?, label?, value?)` - Track user interactions

#### Specialized Functions
- `trackConversion(name, value?, currency?)` - Track conversions
- `trackFormSubmission(formName, formId?)` - Track form submissions
- `trackDownload(fileName, fileType?)` - Track file downloads
- `trackExternalLink(url, linkText?)` - Track external link clicks
- `trackSearch(searchTerm, resultsCount?)` - Track search queries
- `trackLogin(method?)` - Track user login
- `trackSignup(method?)` - Track user registration
- `setUserProperties(properties)` - Set user properties

### Advanced Usage

#### Using the GTM Manager Class

```tsx
import gtm from '@/lib/gtm';

// Check if GTM is ready
if (gtm.isReady()) {
  // Perform GTM operations
  gtm.trackEvent('advanced_event', { custom_data: 'value' });
}

// Get GTM ID
const gtmId = gtm.getGTMId();
```

#### Custom Event Examples

```tsx
// E-commerce tracking
trackEvent('purchase', {
  transaction_id: 'T12345',
  value: 25.25,
  currency: 'USD',
  items: [
    {
      item_id: 'SKU123',
      item_name: 'Product Name',
      category: 'Category',
      quantity: 1,
      price: 25.25
    }
  ]
});

// User engagement
trackInteraction('video_play', 'engagement', 'hero_video');

// Content interaction
trackEvent('content_view', {
  content_type: 'article',
  content_id: 'article-123',
  content_category: 'technology'
});
```

## Event Data Structure

All events pushed to the dataLayer follow this structure:

```javascript
{
  event: 'event_name',
  // Standard parameters
  page_path: '/current/path',
  page_title: 'Page Title',
  page_location: 'https://example.com/current/path',
  // Custom parameters
  custom_parameter: 'value'
}
```

## GTM Container Configuration

### Recommended Triggers

1. **Page View** - Trigger: Page View
2. **Custom Events** - Trigger: Custom Event with event name
3. **Form Submissions** - Trigger: Custom Event `form_submit`
4. **File Downloads** - Trigger: Custom Event `file_download`
5. **External Links** - Trigger: Custom Event `click` with `event_category` equals `outbound`

### Recommended Variables

1. **Page Path** - Variable: `{{page_path}}`
2. **Page Title** - Variable: `{{page_title}}`
3. **Event Category** - Variable: `{{event_category}}`
4. **Event Action** - Variable: `{{event_action}}`
5. **Event Label** - Variable: `{{event_label}}`

## Debugging

### Development Mode

In development, you can:

1. Use GTM Preview mode
2. Check browser console for GTM warnings
3. Inspect `window.dataLayer` in browser DevTools

### Common Issues

1. **GTM not loading**: Check if `NEXT_PUBLIC_GTM_ID` is set correctly
2. **Events not firing**: Verify GTM container configuration
3. **TypeScript errors**: Ensure proper imports from `@/lib/gtm`

## Best Practices

1. **Consistent Naming**: Use snake_case for event names and parameters
2. **Meaningful Events**: Only track events that provide business value
3. **Data Privacy**: Avoid tracking PII without proper consent
4. **Performance**: Don't track too frequently (e.g., on every scroll)
5. **Testing**: Always test in GTM Preview mode before publishing

## Migration from Google Analytics

If migrating from the previous GA implementation:

1. Update environment variable from `NEXT_PUBLIC_GA_ID` to `NEXT_PUBLIC_GTM_ID`
2. Replace direct `gtag` calls with GTM utility functions
3. Configure GA4 tags in GTM container
4. Test all tracking functionality

## Support

For issues or questions about the GTM integration:

1. Check GTM container configuration
2. Verify environment variables
3. Review browser console for errors
4. Test in GTM Preview mode