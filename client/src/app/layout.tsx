import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import QueryProvider from "@/components/providers/queryProvider";
import {
  AnalyticsScripts,
  AnalyticsNoScript,
  PageViewTracker,
} from "@/lib/analytics";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://genmeta.app"),
  title: {
    default: "GenMeta — AI Metadata Generator for Stock Images & Vectors",
    template: "%s | GenMeta",
  },
  description:
    "Generate titles, descriptions, keywords and categories for stock images, vectors and videos with GenMeta. Batch process your files and prepare metadata for leading microstock platforms.",
  keywords: [
    "AI metadata generator",
    "stock metadata generator",
    "microstock metadata generator",
    "AI keyword generator for stock photos",
    "stock photo keyword generator",
    "AI stock photo metadata generator",
    "microstock keyword generator",
    "AI image keyword generator",
    "stock photo metadata generator",
    "AI metadata generator for Adobe Stock",
    "Adobe Stock keyword generator",
    "Shutterstock keyword generator",
    "Shutterstock metadata generator",
    "Freepik metadata generator",
    "AI keywords for stock images",
    "bulk metadata generator",
    "stock video keyword generator",
    "vector metadata generator",
  ],
  authors: [{ name: "GenMeta Technologies" }],
  creator: "GenMeta Technologies",
  publisher: "GenMeta Technologies",
  icons: {
    icon: "/Assets/SVG/icon.svg",
    shortcut: "/Assets/SVG/icon.svg",
    apple: "/Assets/SVG/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://genmeta.app",
    siteName: "GenMeta",
    title: "GenMeta — AI Metadata Generator for Stock Images & Vectors",
    description:
      "Generate titles, descriptions, keywords and categories for stock images, vectors and videos with GenMeta. Batch process your files and prepare metadata for leading microstock platforms.",
    images: [
      {
        url: "/Assets/app-dark.png",
        width: 1200,
        height: 630,
        alt: "GenMeta Desktop AI Metadata Generator for Stock Content",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GenMeta — AI Metadata Generator for Stock Images & Vectors",
    description:
      "Generate titles, descriptions, keywords and categories for stock images, vectors and videos with GenMeta. Batch process your files and prepare metadata for leading microstock platforms.",
    images: ["/Assets/app-dark.png"],
    creator: "@genmeta_app",
  },
  robots: {
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


import { getOrganizationSchema, getSoftwareSchema, getWebSiteSchema } from "@/lib/seo";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const softwareSchema = getSoftwareSchema();
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        <AnalyticsScripts />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteSchema),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans">
        <AnalyticsNoScript />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
          <PageViewTracker />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
