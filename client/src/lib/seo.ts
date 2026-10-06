import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://genmeta.app";
export const SITE_NAME = "GenMeta";

export interface CreateMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description,
  path,
  keywords = [],
  image = "/Assets/app-dark.png",
  noIndex = false,
}: CreateMetadataOptions): Metadata {
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;

  const defaultKeywords = [
    "AI metadata generator",
    "stock metadata generator",
    "microstock metadata generator",
    "stock photo keyword generator",
    "AI stock photo metadata generator",
    "microstock keyword generator",
    "Adobe Stock keyword generator",
    "Shutterstock keyword generator",
    "Freepik metadata generator",
    "stock video keyword generator",
    "vector metadata generator",
    "bulk metadata generator",
    "IPTC metadata generator",
    "XMP metadata generator",
  ];

  const mergedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@genmeta_app",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

export function getSoftwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "GenMeta",
    operatingSystem: "Windows 10, Windows 11 (64-bit)",
    applicationCategory: "MultimediaApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan with 50 credits included",
    },
    description:
      "AI-powered desktop metadata generator for microstock creators. Generate titles, descriptions, and keywords for stock photos, vectors, and videos.",
    url: SITE_URL,
    downloadUrl: `${SITE_URL}/download`,
    featureList: [
      "AI Metadata Generator for Stock Photos, Vectors & Videos",
      "Stock photo keyword generator with relevance-ranking",
      "Batch metadata generation for hundreds of creative files",
      "Metadata embedding directly into EXIF, IPTC and XMP",
      "Agency-formatted CSV exports for Adobe Stock, Shutterstock, Freepik, iStock",
      "Local desktop processing with complete file privacy",
    ],
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GenMeta Technologies",
    url: SITE_URL,
    logo: `${SITE_URL}/Assets/SVG/icon.svg`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@genmeta.app",
    },
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GenMeta",
    url: SITE_URL,
    description:
      "Generate titles, descriptions, keywords and categories for stock images, vectors and videos with GenMeta.",
  };
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}
