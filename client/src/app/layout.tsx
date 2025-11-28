import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import QueryProvider from "@/components/providers/queryProvider";
import {
  AnalyticsScripts,
  AnalyticsNoScript,
  PageViewTracker,
} from "@/lib/analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "GenMeta - APP",
  description: "Generate Metadata and Make image seo friendly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        <AnalyticsScripts />
      </head>
      <body className="flex min-h-full flex-col bg-secondary-50">
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
