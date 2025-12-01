import type React from "react";
import { Download, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export async function getLatestRelease() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/aminurdev/genmeta-app/releases/latest`,
      { next: { revalidate: 3600 } }
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
      fileSize: windowsExe?.size
        ? Math.round(windowsExe.size / (1024 * 1024))
        : null,
      publishedAt: data.published_at,
    };
  } catch (error) {
    console.error("Error fetching release info:", error);
    return null;
  }
}

export default async function DownloadPage() {
  const releaseInfo = await getLatestRelease();
  const downloadUrl = releaseInfo?.downloadUrl;
  const version = releaseInfo?.version;
  const fileSize = releaseInfo?.fileSize;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="relative pt-10 pb-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative">
          <Badge
            variant="outline"
            className="mb-6 px-3 py-1 bg-background/80 backdrop-blur-sm border-violet-200 dark:border-violet-800"
          >
            <span className="text-green-600 dark:text-green-400 mr-1">
              Free
            </span>
            <span>No cost, no subscription required</span>
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Download{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
              GenMeta
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Download GenMeta for your Windows system and start generating
            AI-powered metadata for your images completely free.
          </p>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-5 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-1 gap-8 mx-auto">
            <Card className="overflow-hidden border-2 border-violet-200 dark:border-violet-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-violet-50 dark:from-background dark:to-violet-950/20">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Image
                    src="/Assets/SVG/win.svg"
                    alt="Download"
                    width={48}
                    height={48}
                  />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Windows
                </h2>
                <p className="text-muted-foreground mb-6">
                  Windows 10, 11 (64-bit)
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <Badge
                      variant="outline"
                      className="border-violet-200 dark:border-violet-800"
                    >
                      {version || "Latest"}
                    </Badge>
                  </div>
                  {fileSize && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="text-foreground font-medium">
                        {fileSize} MB
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">License:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Free
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 group mb-4"
                  asChild
                >
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Download for Windows (x64)
                  </a>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Free download • No subscription required • Instant access
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              What&apos;s Included
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Free Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with these powerful features at no cost
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI Metadata Generation"
              description="Generate titles, descriptions, and keywords using advanced AI technology"
              included={true}
            />
            <FeatureCard
              title="Batch Processing (First 100 then Daily 10 Files)"
              description="Process multiple images at once with bulk operations"
              included={true}
            />
            <FeatureCard
              title="Multiple Export Formats"
              description="Export to CSV or embed metadata directly into images"
              included={true}
            />
            <FeatureCard
              title="Custom Keywords"
              description="Add and manage custom keywords for better organization"
              included={true}
            />
            <FeatureCard
              title="Secure Processing"
              description="All processing happens locally on your computer"
              included={true}
            />
            <FeatureCard
              title="Regular Updates"
              description="Get the latest features and improvements automatically"
              included={true}
            />
          </div>
        </div>
      </section>

      {/* Installation Guide */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Installation
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Quick Installation Guide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get up and running in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <InstallStep
              number="1"
              title="Download"
              description="Click the download button above to get the GenMeta installer"
            />
            <InstallStep
              number="2"
              title="Install"
              description="Run the installer and follow the setup wizard instructions"
            />
            <InstallStep
              number="3"
              title="Configure"
              description="Add your Gemini API key in settings and start generating metadata"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Download GenMeta now and transform your image workflow with
            AI-powered metadata generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
              asChild
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2" />
                Download Free Now
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 bg-transparent"
              asChild
            >
              <Link href="/docs">
                <Shield className="w-5 h-5 mr-2" />
                View Setup Guide
              </Link>
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
  included,
}: {
  title: string;
  description: string;
  included: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-violet-100 dark:border-violet-900 h-full">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              included
                ? "bg-green-100 dark:bg-green-900/50"
                : "bg-gray-100 dark:bg-gray-900/50"
            }`}
          >
            {included ? (
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {title}
            </h3>
          </div>
        </div>
        <p className="text-muted-foreground ml-9">{description}</p>
      </CardContent>
    </Card>
  );
}

function InstallStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-lg shadow-violet-500/20">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
