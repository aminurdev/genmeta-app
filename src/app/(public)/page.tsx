import type React from "react";
import {
  SparklesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ArrowPathIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  FolderIcon,
  ListBulletIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import {
  ArrowRight,
  CheckCircle,
  Download,
  MousePointerClick,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

export async function getLatestRelease() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/aminurjs/genmeta-app/releases/latest`,
      {
        next: { revalidate: 3600 },
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
      downloadUrl: windowsExe?.browser_download_url,
    };
  } catch (error) {
    console.error("Error fetching release info:", error);
    return null;
  }
}

export default async function HomePage() {
  const releaseInfo = await getLatestRelease();
  const downloadUrl = releaseInfo?.downloadUrl;
  const version = releaseInfo?.version;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>

        <div className="max-w-7xl mx-auto text-center px-4 relative">
          <Badge
            variant="outline"
            className="mb-6 px-3 py-1 bg-background/80 backdrop-blur-sm border-violet-200 dark:border-violet-800"
          >
            <span className="text-violet-600 dark:text-violet-400 mr-1">
              New
            </span>
            <span>Version {version} now available</span>
          </Badge>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
            Supercharge Your Images with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
              AI Metadata
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Automatically generate accurate titles, descriptions, and keywords
            for your images using advanced AI. Boost discoverability and SEO
            effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 group"
              asChild
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Download for Windows
                <Badge
                  variant="outline"
                  className="ml-2 bg-white/20 border-white/30 text-white"
                >
                  v{version}
                </Badge>
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 group"
              asChild
            >
              <Link href="/generate/v2">
                Try Web Version
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Compatible with Windows 10/11 (64-bit)
          </p>

          <div className="mt-16 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-sm opacity-50"></div>
            <div className="relative bg-card rounded-xl overflow-hidden shadow-2xl border border-violet-200 dark:border-violet-800">
              <Image
                src="/Assets/app.png"
                alt="GenMeta App Preview"
                width={2000}
                height={1200}
                className="w-full h-auto"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful AI Tools for Your Images
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to enhance your image metadata and improve
              discoverability
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI-Powered Analysis"
              description="Generate accurate titles, descriptions, and SEO-optimized keywords using Gemini AI technology."
              icon={SparklesIcon}
            />
            <FeatureCard
              title="Bulk Processing"
              description="Process entire directories of images at once with customizable metadata settings and batch operations."
              icon={ArrowPathIcon}
            />
            <FeatureCard
              title="Flexible Export"
              description="Export metadata to CSV or save directly to processed images with embedded metadata for seamless workflow."
              icon={DocumentTextIcon}
            />
            <FeatureCard
              title="Smart Keyword Generation"
              description="Get relevant, SEO-optimized keywords that improve discoverability across platforms and search engines."
              icon={ListBulletIcon}
            />
            <FeatureCard
              title="Customizable Settings"
              description="Tailor the output to your specific needs with adjustable title length, description depth, and keyword count."
              icon={Cog6ToothIcon}
            />
            <FeatureCard
              title="Cloud Integration"
              description="Seamlessly save your metadata to cloud services or export for use in other applications."
              icon={CloudArrowUpIcon}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Quick Start
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Four Simple Steps to Get Started
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Begin enhancing your images in minutes with our intuitive workflow
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-violet-200 via-indigo-300 to-violet-200 dark:from-violet-900 dark:via-indigo-800 dark:to-violet-900 transform -translate-y-1/2 z-0"></div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
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
                description="Start AI processing with just a single click"
                icon={CpuChipIcon}
              />
              <StepCard
                number="4"
                title="Review"
                description="View results and access processed images"
                icon={MousePointerClick}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Settings Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Customization
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Settings for Every Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailor GenMeta to your specific workflow with flexible
              configuration options
            </p>
          </div>

          <Tabs defaultValue="api" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="output">Output Settings</TabsTrigger>
            </TabsList>

            <TabsContent
              value="api"
              className="p-6 bg-card rounded-xl border border-border shadow-sm"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 text-violet-500 mr-2" />
                  API Configuration
                </h3>
                <div className="grid gap-4">
                  <SettingItem
                    title="Gemini API Key"
                    description="Connect to Google's powerful Gemini AI for image analysis"
                    icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                  />
                  <SettingItem
                    title="User Authentication"
                    description="Secure access with user ID validation"
                    icon={<UserGroupIcon className="w-5 h-5 text-violet-500" />}
                  />
                  <SettingItem
                    title="Premium API Options"
                    description="Unlock faster processing and additional features"
                    icon={<ChartBarIcon className="w-5 h-5 text-violet-500" />}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="output"
              className="p-6 bg-card rounded-xl border border-border shadow-sm"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                  <DocumentTextIcon className="w-6 h-6 text-violet-500 mr-2" />
                  Output Settings
                </h3>
                <div className="grid gap-4">
                  <SettingItem
                    title="Title Length"
                    description="Set the optimal length for generated titles (short, medium, long)"
                    icon={
                      <DocumentTextIcon className="w-5 h-5 text-violet-500" />
                    }
                  />
                  <SettingItem
                    title="Description Depth"
                    description="Control the detail level in your image descriptions"
                    icon={
                      <DocumentTextIcon className="w-5 h-5 text-violet-500" />
                    }
                  />
                  <SettingItem
                    title="Keyword Count"
                    description="Specify how many keywords to generate per image"
                    icon={
                      <ListBulletIcon className="w-5 h-5 text-violet-500" />
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Bulk Operations Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Efficiency
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Streamlined Bulk Operations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Process multiple images at once with powerful batch tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BulkFeatureCard
              title="Unlimited Generation"
              description="Generate and edit metadata for an unlimited number of images without any restrictions."
              icon={CloudArrowUpIcon}
            />
            <BulkFeatureCard
              title="Meta Included JPG, PNG, and CSV Exports"
              description="Export processed images with embedded metadata or download all metadata neatly organized in a CSV file."
              icon={DocumentTextIcon}
            />
            <BulkFeatureCard
              title="Custom Order Keywords"
              description="Easily add and arrange keywords across all images to maintain consistent and optimized tagging."
              icon={ListBulletIcon}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their image
              workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="GenMeta has saved me countless hours of manual metadata entry. The AI is surprisingly accurate!"
              author="Sarah J."
              role="Professional Photographer"
            />
            <TestimonialCard
              quote="My stock photo sales increased by 30% after I started using GenMeta for all my image metadata."
              author="Michael T."
              role="Stock Photographer"
            />
            <TestimonialCard
              quote="The bulk processing feature is a game-changer for managing large image libraries."
              author="Elena R."
              role="Digital Marketing Manager"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>

        <div className="max-w-4xl mx-auto text-center px-4">
          <Badge
            variant="outline"
            className="mb-6 px-3 py-1 border-violet-200 dark:border-violet-800"
          >
            Get Started Today
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Transform Your Images?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of users who are already enhancing their images with
            our AI-powered platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
              asChild
            >
              <Link href="/generate/v2">Start Free Trial</Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
              asChild
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2" />
                Download Desktop App
              </a>
            </Button>
          </div>
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
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-violet-100 dark:border-violet-900 h-full">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-4 group-hover:bg-violet-500 transition-colors duration-300">
          <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

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
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-violet-100 dark:border-violet-900 h-full bg-gradient-to-br from-white to-violet-50 dark:from-background dark:to-violet-950/20">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500 transition-colors duration-300">
          <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center relative">
      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-violet-500/20 relative z-10">
        {number}
      </div>
      <div className="bg-card rounded-xl p-6 border border-violet-100 dark:border-violet-900 shadow-sm hover:shadow-md transition-all duration-300 -mt-8 pt-10">
        <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SettingItem({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-violet-100 dark:border-violet-900 h-full">
      <CardContent className="p-6">
        <div className="text-violet-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
          </svg>
        </div>
        <p className="text-foreground mb-6 italic">{quote}</p>
        <div className="mt-auto">
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const Footer = () => {
  return (
    <footer className="bg-background text-card-foreground py-16 border-t border-violet-100 dark:border-violet-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4 w-52">
              <Link href="/">
                <Image
                  src={"/Assets/SVG/logo.svg"}
                  className="h-16 py-2 w-auto"
                  alt="GenMeta logo"
                  width={128}
                  height={128}
                />
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Transform your images with advanced AI technology and
              professional-grade metadata tools for better discoverability.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link
                  href="/generate/v2"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  Generate
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">
              Resources
            </h4>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/get-app"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  Get APP
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">
              Contact
            </h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-violet-500"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a
                  href="mailto:helpgenmeta@gmail.com"
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  helpgenmeta@gmail.com
                </a>
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-violet-500"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Nilphamari, Rangpur, Bangladesh
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-violet-100 dark:border-violet-900 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GenMeta. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
