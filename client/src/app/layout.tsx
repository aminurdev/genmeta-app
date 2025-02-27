import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Image Processor",
  description: "Process and enhance your images with AI",
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
    >
      <body className="flex min-h-full flex-col bg-secondary-50">
        <Navigation />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-secondary-200">
          <div className="py-8 max-w-screen-xl mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-secondary-500">
                &copy; {new Date().getFullYear()} Image Processor. All rights
                reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
