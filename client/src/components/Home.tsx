"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { ArrowRight, CheckCircle, Download, Crown, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Banner } from "@/components/main/banner";
import { useTheme } from "next-themes";

interface Props {
  releaseInfo: {
    version: string;
    downloadUrl: string;
  } | null;
}

export default function HomePage({ releaseInfo }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setTimeout(() => setIsLoaded(true), 100);
    };
    loadData();
  }, []);

  const downloadUrl = releaseInfo?.downloadUrl;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background -z-10" />
        <div className="max-w-7xl mx-auto text-center px-4">
          <div
            className={`transform transition-all duration-1000 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <Badge variant="outline" className="mb-6 inline-flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              AI-Powered Metadata Generator
            </Badge>
          </div>

          <div
            className={`transform transition-all duration-1000 delay-200 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Boost Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 animate-gradient-x">
                Microstock Sales
              </span> {" "}
              with <br/> AI Powered Metadata
            </h1>
          </div>

          <div
            className={`transform transition-all duration-1000 delay-400 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <p className="text-muted-foreground text-lg mb-10 max-w-3xl mx-auto">
              Generate SEO-optimized titles, descriptions, and keywords for
              Adobe Stock, Shutterstock, Freepik, and other microstock
              platforms. Increase your visibility and sales with AI-powered
              metadata that buyers actually search for.
            </p>
          </div>

          <div
            className={`transform transition-all duration-1000 delay-600 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="group" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5 mr-2" />
                  Download GenMeta Free
                </a>
              </Button>
              <Button size="lg" variant="outline" className="group" asChild>
                <Link href="/pricing">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          <div
            className={`transform transition-all duration-1000 delay-800 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <p className="text-sm text-muted-foreground mb-8">
              Compatible with Windows 10/11 (64-bit) • Optimized for Adobe
              Stock, Shutterstock & Freepik • Free version available
            </p>
            <Banner />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <AnimatedSection delay={200}>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Key Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Features for{" "}
                <span className="text-primary">Efficient Workflow</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Everything you need to create professional metadata that ranks
                higher and sells more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<SparklesIcon className="w-6 h-6" />}
                title="AI Generation"
                description="State-of-the-art vision models generate tags and descriptions with incredible accuracy."
              />
              <FeatureCard
                icon={<ListBulletIcon className="w-6 h-6" />}
                title="Batch Processing"
                description="Process entire folders of content at once. Save presets for different stock agencies."
              />
              <FeatureCard
                icon={<DocumentTextIcon className="w-6 h-6" />}
                title="Universal Support"
                description="Perfect for photos, 4K videos, and vector illustrations."
              />
              <FeatureCard
                icon={<ChartBarIcon className="w-6 h-6" />}
                title="Smart Keywords"
                description="Keywords are sorted by relevance and relevance score for the best ranking results."
              />
              <FeatureCard
                icon={<Cog6ToothIcon className="w-6 h-6" />}
                title="Custom Instructions"
                description="Tailor the AI behavior to match specific agency requirements or your personal style."
              />
              <FeatureCard
                icon={<Download className="w-6 h-6" />}
                title="Direct Export"
                description="Export to CSV, or write metadata directly into XMP sidecar files."
              />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Workflow Section */}
      <AnimatedSection delay={400}>
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Simple Workflow
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From upload to export in seconds
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <WorkflowStep
                number="01"
                icon={<Download className="w-8 h-8" />}
                title="Download App"
                description="Install the lightweight desktop application for macOS or Windows."
              />
              <WorkflowStep
                number="02"
                icon={<DocumentTextIcon className="w-8 h-8" />}
                title="Add Files"
                description="Drag and drop your images, videos, or vectors into the workspace."
              />
              <WorkflowStep
                number="03"
                icon={<SparklesIcon className="w-8 h-8" />}
                title="Generate"
                description="Hit generate and watch as the AI creates high-quality metadata."
              />
              <WorkflowStep
                number="04"
                icon={<CheckCircle className="w-8 h-8" />}
                title="Review & Export"
                description="Fine-tune your results and export in your preferred format."
              />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Creator Types Section */}
      <AnimatedSection delay={600}>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                For All Creators
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Made for every type of stock creator
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CreatorCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
                title="Stock Photographers"
                description="Generate accurate titles and keywords for your photo collections quickly."
              />
              <CreatorCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                }
                title="Vector Designers"
                description="Describe illustrations and icons with precise, searchable metadata."
              />
              <CreatorCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                }
                title="Video Creators"
                description="Create compelling descriptions for your footage and motion content."
              />
              <CreatorCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                }
                title="Content Publishers"
                description="Scale your catalog with consistent, high-quality metadata at volume."
              />
            </div>
          </div>
        </section>
      </AnimatedSection>


      {/* Bulk Operations Section */}
      <AnimatedSection delay={1000}>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Desktop Power
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Scale Your Microstock Business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Professional portfolio management tools designed for serious
                stock photographers and content creators
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <BulkFeatureCard
                title="Unlimited Files Processing"
                description="Process your entire stock files with no image limits. Scale from hundreds to hundreds of thousands of images for maximum earning potential."
                icon={ArrowPathIcon}
              />
              <BulkFeatureCard
                title="Multi-Platform Export"
                description="Export optimized metadata for Adobe Stock, Shutterstock, Freepik, and other platforms simultaneously. Save hours of manual work."
                icon={DocumentTextIcon}
              />
              <BulkFeatureCard
                title="Trending Keywords Database"
                description="Access AI-curated trending keywords and add your own high-performing terms to boost discoverability across all platforms."
                icon={ListBulletIcon}
              />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection delay={1200}>
        <section className="py-24">
          <div className="max-w-4xl mx-auto text-center px-4">
            <Badge variant="outline" className="mb-6">
              Get Started Today
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Boost Your Microstock Revenue?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of successful stock photographers earning more with
              AI-optimized metadata. Start your free trial and see results in
              your first week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5 mr-2" />
                  Download GenMeta Free
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">
                  <Crown className="w-5 h-5 mr-2" />
                  View Pricing Plans
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}

// Animated Section Component
function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transform transition-all duration-1000 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Workflow Step Component
function WorkflowStep({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center group">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="text-sm font-semibold text-primary mb-2">{number}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Creator Card Component
function CreatorCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Bulk Feature Card Component
function BulkFeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
          <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}



// Footer Component
export const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="bg-muted/30 border-t py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <Image
                  src="/Assets/SVG/logo.svg"
                  className="h-16 w-auto"
                  alt="GenMeta logo"
                  width={128}
                  height={128}
                />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your images with our powerful desktop application
              featuring advanced AI technology and professional-grade metadata
              tools.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/pricing", label: "Pricing" },
                { href: "/download", label: "Download App" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: "/terms", label: "Terms & Conditions" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/refund-policy", label: "Refund Policy" },
                { href: "/delivery-policy", label: "Delivery Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a
                  href="https://wa.me/8801817710493"
                  className="text-primary hover:underline"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href="mailto:support@genmeta.app"
                  className="text-primary hover:underline break-all"
                >
                  support@genmeta.app
                </a>
              </li>
            </ul>
            {mounted && (
              <div className="mt-4">
                <Image
                  src={
                    resolvedTheme === "dark"
                      ? "/Assets/Payment Gateway Light.png"
                      : "/Assets/Payment Gateway Dark.png"
                  }
                  alt="Payment Gateway"
                  width={300}
                  height={60}
                  className="w-full max-w-xs h-auto"
                  priority={false}
                  key={resolvedTheme}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} GenMeta Technologies. All rights
              reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/refund-policy" className="hover:text-primary transition-colors">
                Refunds
              </Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
