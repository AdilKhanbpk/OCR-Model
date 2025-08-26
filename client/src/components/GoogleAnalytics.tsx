import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  trackingId?: string;
}

export default function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps) {
  const GA_TRACKING_ID = trackingId || import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

  useEffect(() => {
    if (!GA_TRACKING_ID) {
      console.warn('⚠️ Google Analytics not configured - missing VITE_GOOGLE_ANALYTICS_ID');
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_TRACKING_ID}', {
        page_title: document.title,
        page_location: window.location.href,
      });
    `;
    document.head.appendChild(script2);

    console.log('📊 Google Analytics initialized:', GA_TRACKING_ID);

    // Cleanup function
    return () => {
      // Remove scripts when component unmounts
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [GA_TRACKING_ID]);

  return null; // This component doesn't render anything
}

// Analytics tracking functions
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackPageView = (page_path: string, page_title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID, {
      page_path,
      page_title,
    });
  }
};

// OCR-specific tracking events
export const trackOCRUpload = (fileType: string, fileSize: number) => {
  trackEvent('file_upload', 'OCR', `${fileType}_${Math.round(fileSize / 1024)}KB`);
};

export const trackOCRProcessing = (docType: string, processingTime: number, confidence: number) => {
  trackEvent('ocr_processing', 'OCR', docType, Math.round(processingTime));
  trackEvent('ocr_confidence', 'OCR', docType, Math.round(confidence * 100));
};

export const trackOCRExport = (format: string, jobCount: number) => {
  trackEvent('export', 'OCR', format, jobCount);
};

export const trackUserSignup = (method: string) => {
  trackEvent('sign_up', 'User', method);
};

export const trackUserLogin = (method: string) => {
  trackEvent('login', 'User', method);
};

export const trackAPIUsage = (endpoint: string, responseTime: number) => {
  trackEvent('api_call', 'API', endpoint, responseTime);
};

// Enhanced ecommerce tracking (for subscription plans)
export const trackPurchase = (planName: string, value: number, currency: string = 'USD') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: `txn_${Date.now()}`,
      value: value,
      currency: currency,
      items: [{
        item_id: planName.toLowerCase().replace(' ', '_'),
        item_name: planName,
        category: 'Subscription',
        quantity: 1,
        price: value,
      }]
    });
  }
};

// Custom dimensions for OCR analytics
export const setCustomDimensions = (dimensions: Record<string, string>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID, {
      custom_map: dimensions,
    });
  }
};

// Hook for tracking page views in React Router
export const usePageTracking = () => {
  useEffect(() => {
    const trackPageView = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID, {
          page_path: window.location.pathname,
          page_title: document.title,
        });
      }
    };

    // Track initial page load
    trackPageView();

    // Track route changes (for SPA)
    const handleRouteChange = () => {
      setTimeout(trackPageView, 100); // Small delay to ensure title is updated
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
};

// Instructions for Google Analytics Setup
export function printGoogleAnalyticsInstructions() {
  console.log('\n📊 GOOGLE ANALYTICS SETUP INSTRUCTIONS:');
  console.log('========================================');
  console.log('1. Go to Google Analytics: https://analytics.google.com/');
  console.log('2. Create a new account or select existing one');
  console.log('3. Create a new property for your website');
  console.log('4. Choose "Web" as the platform');
  console.log('5. Enter your website details:');
  console.log('   - Website Name: OCR Service Pro');
  console.log('   - Website URL: https://your-domain.com');
  console.log('   - Industry Category: Technology');
  console.log('   - Reporting Time Zone: Your timezone');
  console.log('6. Copy the Measurement ID (starts with G-XXXXXXXXXX)');
  console.log('7. Add it to your .env file as GOOGLE_ANALYTICS_ID');
  console.log('\n📝 Required .env variables:');
  console.log('GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"');
  console.log('\n🎯 Tracked Events:');
  console.log('- File uploads (type, size)');
  console.log('- OCR processing (doc type, time, confidence)');
  console.log('- Data exports (format, count)');
  console.log('- User signups and logins');
  console.log('- API usage and performance');
  console.log('- Subscription purchases');
  console.log('========================================\n');
}
