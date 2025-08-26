import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: object;
}

export default function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', ogTitle || title, 'property');
    updateMetaTag('og:description', ogDescription || description, 'property');
    updateMetaTag('og:type', ogType, 'property');
    updateMetaTag('og:url', canonicalUrl || window.location.href, 'property');
    if (ogImage) updateMetaTag('og:image', ogImage, 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', ogTitle || title);
    updateMetaTag('twitter:description', ogDescription || description);
    if (ogImage) updateMetaTag('twitter:image', ogImage);

    // Canonical URL
    if (canonicalUrl) {
      updateCanonicalLink(canonicalUrl);
    }

    // Structured Data
    if (structuredData) {
      updateStructuredData(structuredData);
    }

    // Cleanup function
    return () => {
      // Remove structured data script when component unmounts
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, canonicalUrl, ogTitle, ogDescription, ogImage, ogType, twitterCard, structuredData]);

  return null; // This component doesn't render anything
}

function updateMetaTag(name: string, content: string, attribute: string = 'name') {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}

function updateCanonicalLink(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  
  canonical.setAttribute('href', url);
}

function updateStructuredData(data: object) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// Predefined structured data schemas
export const createWebApplicationSchema = (name: string, description: string, url: string) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": name,
  "description": description,
  "url": url,
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "featureList": [
    "OCR Text Extraction",
    "Multi-language Support",
    "PDF Processing",
    "Image Processing",
    "API Access",
    "Batch Processing"
  ]
});

export const createHowToSchema = (name: string, description: string, steps: string[]) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": name,
  "description": description,
  "step": steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": `Step ${index + 1}`,
    "text": step
  }))
});

export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const createServiceSchema = (name: string, description: string, provider: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": name,
  "description": description,
  "provider": {
    "@type": "Organization",
    "name": provider
  },
  "serviceType": "OCR Service",
  "areaServed": "Worldwide",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "OCR Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Image OCR",
          "description": "Extract text from images"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "PDF OCR",
          "description": "Extract text from PDF documents"
        }
      }
    ]
  }
});
