"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Download,
  Settings,
  Zap,
  Shield,
  FileText,
  Image,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Github,
} from "lucide-react";
import { getLatestRelease } from "@/app/(public)/download/page";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

export function DocsContent() {
  const [releaseInfo, setReleaseInfo] = useState<any>(null);
  const [showModal, setShowModal] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchReleaseInfo = async () => {
      const data = await getLatestRelease();
      setReleaseInfo(data);
    };
    fetchReleaseInfo();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleContinue = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Documentation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BookOpen className="size-5 text-blue-600" />
              GenMeta Documentation (In Progress)
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm sm:text-base">
              We're currently working on finalizing the documentation for
              GenMeta. While some sections are ready, others are still being
              written or improved. Your patience is appreciated as we continue
              to build a comprehensive guide to help you set up and use all of
              GenMeta's features effectively.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
            <Button
              onClick={handleContinue}
              className="flex items-center gap-2"
            >
              <BookOpen className="size-4" />
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Introduction */}
        <div id="introduction" className="space-y-4">
          <div className="flex items-center gap-2">
            <NextImage
              src="/Assets/icon.png"
              alt="GenMeta Icon"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <h1 className="text-4xl font-bold tracking-tight">GenMeta</h1>
            <Badge variant="secondary">
              v{releaseInfo?.version || "1.0.0"}
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground">
            AI-powered desktop application for generating accurate titles,
            descriptions, and SEO-optimized keywords for your images.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <a
                href={releaseInfo?.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-4 mr-2" />
                Download for Windows
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/aminurdev/genmeta-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        <Separator />

        {/* What is GenMeta */}
        <div id="what-is-genmeta" className="space-y-4">
          <h2 className="text-2xl font-semibold">What is GenMeta?</h2>
          <p className="text-muted-foreground">
            GenMeta is a powerful desktop application that leverages advanced AI
            technology to automatically generate metadata for your images. It
            helps content creators, photographers, and digital marketers enhance
            their image SEO and organization by providing:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Accurate and descriptive titles</li>
            <li>Detailed descriptions that capture image content</li>
            <li>SEO-optimized keywords for better discoverability</li>
            <li>Batch processing capabilities for efficiency</li>
            <li>Multiple export formats for various workflows</li>
          </ul>
        </div>

        <Separator />

        {/* Key Features */}
        <div id="key-features" className="space-y-4">
          <h2 className="text-2xl font-semibold">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-violet-600" />
                  AI-Powered Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uses Google's Gemini AI to analyze images and generate
                  accurate, contextual metadata.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5 text-blue-600" />
                  Batch Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Process multiple images simultaneously with customizable
                  settings and bulk operations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5 text-green-600" />
                  Local Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your images never leave your computer. All processing happens
                  locally with secure API connections.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-orange-600" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Export metadata to CSV or embed directly into images with EXIF
                  data support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Installation */}
        <div id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">Installation</h2>

          <div id="system-requirements" className="space-y-4">
            <h3 className="text-lg font-medium">System Requirements</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Operating System:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Windows 10/11 (64-bit)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">RAM:</span>
                    <span className="text-sm text-muted-foreground">
                      4GB minimum, 8GB recommended
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Storage:</span>
                    <span className="text-sm text-muted-foreground">
                      500MB free space
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Internet:</span>
                    <span className="text-sm text-muted-foreground">
                      Required for AI processing
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="download-install" className="space-y-4">
            <h3 className="text-lg font-medium">Download & Install</h3>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Step 1: Download</span>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={releaseInfo?.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="size-4 mr-2" />
                      Download v{releaseInfo?.version || "1.0.0"}
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Download the latest GenMeta installer for Windows (x64)
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="mb-2">
                  <span className="text-sm font-medium">Step 2: Install</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Run the downloaded installer and follow the setup wizard:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>Accept the license agreement</li>
                  <li>Choose installation directory</li>
                  <li>Select additional tasks (desktop shortcut, etc.)</li>
                  <li>Complete the installation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Setup */}
        <div id="setup" className="space-y-4">
          <h2 className="text-2xl font-semibold">Setup</h2>

          <div id="api-key-setup" className="space-y-4">
            <h3 className="text-lg font-medium">API Key Setup</h3>
            <p className="text-muted-foreground">
              GenMeta requires a Google Gemini API key to function. Follow these
              steps to get your free API key:
            </p>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Step 1: Get Gemini API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Visit Google AI Studio to get your free Gemini API key:
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4 mr-2" />
                      Get API Key
                    </a>
                  </Button>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Sign in with your Google account</li>
                    <li>Click "Create API Key"</li>
                    <li>Copy the generated API key</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Step 2: Configure in GenMeta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add your API key to GenMeta:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Open GenMeta application</li>
                    <li>Go to Settings → API Configuration</li>
                    <li>Paste your Gemini API key</li>
                    <li>Click "Save" and test the connection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="first-run" className="space-y-4">
            <h3 className="text-lg font-medium">First Run</h3>
            <p className="text-muted-foreground">
              When you first launch GenMeta, you'll be guided through the
              initial setup:
            </p>
            <div className="bg-muted rounded-lg p-4">
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2">
                <li>Welcome screen with app overview</li>
                <li>API key configuration (if not set during installation)</li>
                <li>Default settings configuration</li>
                <li>Quick tutorial on basic features</li>
                <li>Ready to process your first image!</li>
              </ol>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Start */}
        <div id="quick-start" className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
          <p className="text-muted-foreground">
            Get started with GenMeta in just a few simple steps. This guide will
            walk you through processing your first image.
          </p>

          <div id="single-image" className="space-y-4">
            <h3 className="text-lg font-medium">Single Image Processing</h3>
            <Tabs defaultValue="step1" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="step1">Step 1</TabsTrigger>
                <TabsTrigger value="step2">Step 2</TabsTrigger>
                <TabsTrigger value="step3">Step 3</TabsTrigger>
                <TabsTrigger value="step4">Step 4</TabsTrigger>
              </TabsList>
              <TabsContent value="step1" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="size-5" />
                      Select Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose the image you want to process:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                      <li>Click "Select Image" or drag & drop</li>
                      <li>Supported formats: JPG, PNG, WebP, GIF</li>
                      <li>Maximum file size: 10MB</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="step2" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="size-5" />
                      Configure Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Customize the metadata generation:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                      <li>Title length: Short, Medium, or Long</li>
                      <li>Description detail: Basic or Detailed</li>
                      <li>Number of keywords: 5-20</li>
                      <li>Language preference</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="step3" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="size-5" />
                      Generate Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Let AI analyze your image:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                      <li>Click "Generate Metadata"</li>
                      <li>Wait for AI processing (usually 5-10 seconds)</li>
                      <li>Review the generated results</li>
                      <li>Edit if needed</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="step4" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="size-5" />
                      Export Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Save your metadata:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                      <li>Export to CSV file</li>
                      <li>Copy to clipboard</li>
                      <li>Save to image EXIF data</li>
                      <li>Create new image with embedded metadata</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div id="batch-processing" className="space-y-4">
            <h3 className="text-lg font-medium">Batch Processing</h3>
            <p className="text-muted-foreground mb-4">
              Process multiple images at once for maximum efficiency:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Select Multiple Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Use "Select Folder" to process entire directories</li>
                    <li>Or select multiple individual files</li>
                    <li>Set filters by file type or size</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Batch Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Apply same settings to all images</li>
                    <li>Set processing priority</li>
                    <li>Configure output format</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Separator />

        {/* AI Metadata Generation */}
        <div id="ai-metadata" className="space-y-4">
          <h2 className="text-2xl font-semibold">AI Metadata Generation</h2>
          <p className="text-muted-foreground">
            GenMeta uses Google's advanced Gemini AI to analyze your images and
            generate contextually accurate metadata.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Smart Titles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generates descriptive, SEO-friendly titles that capture the
                  essence of your image content.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Detailed Descriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Creates comprehensive descriptions including objects, scenes,
                  colors, and context.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SEO Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Identifies relevant keywords for better search engine
                  optimization and discoverability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div id="export-options" className="space-y-4">
          <h2 className="text-2xl font-semibold">Export Options</h2>
          <p className="text-muted-foreground">
            GenMeta offers multiple ways to export and use your generated
            metadata:
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-blue-600" />
                  CSV Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Export all metadata to a structured CSV file:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>Filename, Title, Description, Keywords columns</li>
                  <li>Customizable column order</li>
                  <li>Compatible with Excel and Google Sheets</li>
                  <li>Bulk export for batch processing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="size-5 text-green-600" />
                  EXIF Embedding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Embed metadata directly into image files:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>Preserves original image quality</li>
                  <li>Metadata travels with the image</li>
                  <li>Compatible with most image viewers</li>
                  <li>Supports IPTC and XMP standards</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Troubleshooting */}
        <div id="troubleshooting" className="space-y-4">
          <h2 className="text-2xl font-semibold">Troubleshooting</h2>
          <p className="text-muted-foreground">
            Common issues and their solutions:
          </p>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Key Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">
                    Problem: "Invalid API Key" error
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Solution:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Verify your API key is correctly copied</li>
                    <li>Check if the API key has proper permissions</li>
                    <li>
                      Ensure your Google Cloud project has Gemini API enabled
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processing Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">
                    Problem: Slow processing or timeouts
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Solution:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Check your internet connection</li>
                    <li>Reduce image file size if very large</li>
                    <li>Try processing fewer images at once</li>
                    <li>Restart the application</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Installation Problems
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">
                    Problem: Application won't start
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Solution:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Run as administrator</li>
                    <li>Check Windows Defender/antivirus settings</li>
                    <li>Reinstall with latest version</li>
                    <li>Contact support if issue persists</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
