import { getCurrentUser } from "@/services/auth-services";
import {
  SparklesIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ArrowPathIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon,
  FolderIcon,
  ListBulletIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

async function getLatestRelease() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/aminurjs/genmeta-app/releases/latest`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );
    if (!response.ok) throw new Error("Failed to fetch release info");
    const data = await response.json();

    // Find the Windows executable in the assets
    const windowsExe = data.assets.find(
      (asset: GitHubAsset) =>
        asset.name.startsWith("GenMeta-Setup-") && asset.name.endsWith(".exe")
    );

    return {
      version: data.tag_name,
      downloadUrl:
        windowsExe?.browser_download_url ||
        "https://github.com/aminurjs/genmeta-app/releases",
    };
  } catch (error) {
    console.error("Error fetching release info:", error);
    return null;
  }
}

export default async function HomePage() {
  const releaseInfo = await getLatestRelease();
  const downloadUrl =
    releaseInfo?.downloadUrl ||
    "https://github.com/aminurjs/genmeta-app/releases";
  const version = releaseInfo?.version || "3.2.2";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-muted/20">
        <div className="max-w-7xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Supercharge Your Images with{" "}
            <span className="text-primary">AI Metadata</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatically generate accurate titles, descriptions, and keywords
            for your images using advanced AI. Boost discoverability and SEO
            effortlessly. Now available for Windows!
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
              Download Latest Version (v{version})
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Windows 10/11 (64-bit)
          </p>{" "}
          <div className="py-10">
            <Image
              src="/Assets/app.png"
              alt="App Preview"
              width={2000}
              height={2000}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Powerful Features for Your Images
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI-Powered Analysis"
              description="Generate accurate titles, descriptions, and SEO-optimized keywords using Gemini AI technology."
              icon={SparklesIcon}
            />
            <FeatureCard
              title="Bulk Processing"
              description="Process entire directories of images at once with customizable metadata settings."
              icon={ArrowPathIcon}
            />
            <FeatureCard
              title="Flexible Export"
              description="Export metadata to CSV or save directly to processed images with embedded metadata."
              icon={DocumentTextIcon}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Quick Start Guide
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Configure"
              description="Set up your API key and preferences in Settings"
              icon={Cog6ToothIcon}
            />
            <StepCard
              number="2"
              title="Select"
              description="Choose your images directory using Browse"
              icon={FolderIcon}
            />
            <StepCard
              number="3"
              title="Generate"
              description="Start AI processing with one click"
              icon={CpuChipIcon}
            />
            <StepCard
              number="4"
              title="Review"
              description="View results and access processed images"
              icon={ListBulletIcon}
            />
          </div>
        </div>
      </section>

      {/* Settings Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Customizable Settings
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                API Configuration
              </h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" />
                  Gemini API key for AI image analysis
                </li>
                <li className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-primary" />
                  User ID for access validation
                </li>
                <li className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-primary" />
                  Premium API option for faster processing
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                Output Settings
              </h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary" />
                  Customizable title length
                </li>
                <li className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary" />
                  Adjustable description length
                </li>
                <li className="flex items-center gap-2">
                  <ListBulletIcon className="w-5 h-5 text-primary" />
                  Configurable keyword count
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bulk Operations Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Bulk Operations
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Save All Changes"
              description="Save any edits you've made to the metadata in one click"
              icon={CloudArrowUpIcon}
            />
            <FeatureCard
              title="Export CSV"
              description="Export all metadata to a CSV file for easy management"
              icon={DocumentTextIcon}
            />
            <FeatureCard
              title="Common Keywords"
              description="Add the same keyword to all images at once with flexible positioning"
              icon={ListBulletIcon}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Ready to Transform Your Images?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who are already enhancing their images with
            our AI-powered platform.
          </p>
          <RedirectUrl text="Start Free Trial" />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
      <Icon className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-card-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

const RedirectUrl = async ({ text }: { text: string }) => {
  const user = await getCurrentUser();

  return (
    <Link
      href={user ? "/generate/v2" : "/signup"}
      className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
    >
      {text}
    </Link>
  );
};

import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-background text-card-foreground py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4 w-52">
              {" "}
              <Link href="/">
                <Image
                  src={"/Assets/SVG/Asset 5.svg"}
                  className=" h-16 py-2 w-auto"
                  alt="logo"
                  width={128}
                  height={128}
                />
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Transform your images with advanced AI technology and
              professional-grade tools.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  href="/generate/v2"
                  className="hover:text-card-foreground"
                >
                  Generate
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-card-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-card-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-card-foreground">
                  Terms & Condition
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-card-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-card-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                {" "}
                <a
                  href="mailto:helpgenmeta@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  helpgenmeta@gmail.com
                </a>
              </li>
              <li>Nilphamari, Rangpur, Bangladesh</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GenMeta. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
