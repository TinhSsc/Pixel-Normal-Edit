import { useEffect } from 'react';

export default function SEOHeader({ title, description, schema }) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
    }

    // 2. Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // 3. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    // Remove hash and ensure consistent query params for canonical
    canonical.href = window.location.origin + window.location.pathname + window.location.search;

    // 4. Inject Structured Data (Schema JSON-LD)
    let script = document.getElementById('seo-structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": title || "Pixel Normal Edit",
      "operatingSystem": "Any",
      "applicationCategory": "MultimediaApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "VND"
      }
    };
    
    script.textContent = JSON.stringify({ ...baseSchema, ...schema });

    return () => {
      // Cleanup if needed (optional, keeping it allows the tags to persist correctly until next render)
    };
  }, [title, description, schema]);

  return null;
}
