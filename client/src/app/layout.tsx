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
  title: "GenMeta – AI Metadata for Microstock",
  description:
    "Generate titles, descriptions and keywords for your microstock photos, videos and vectors. Formatted for Adobe Stock, Shutterstock, Freepik and more.",
  icons: {
    icon: "/Assets/SVG/icon.svg",
    shortcut: "/Assets/SVG/icon.svg",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        <AnalyticsScripts />
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
