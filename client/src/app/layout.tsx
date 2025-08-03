import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/main/theme-provider";
import { Analytics, GTMNoScript } from "./analytics";
import { GTMConnect } from "./ga-connect";
import { GtagAnalytics } from "./gtag-analytics";
import { GtagPageTracker } from "./gtag-page-tracker";

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
      <GTMConnect />
      <GtagAnalytics />
      <body className="flex min-h-full flex-col bg-secondary-50">
        <GTMNoScript />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <GtagPageTracker />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
