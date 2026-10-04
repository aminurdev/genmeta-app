import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { getCurrentUser } from "@/services/auth-services";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import "./landing.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GenMeta – AI metadata for microstock contributors",
  description:
    "Generate SEO-optimized titles, descriptions and keywords for Adobe Stock, Shutterstock and Freepik from your desktop.",
};

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className={`landing ${display.variable} ${mono.variable} min-h-screen`}>
      <LandingNavbar propUser={user} />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}
