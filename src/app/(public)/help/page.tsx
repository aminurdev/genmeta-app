import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Settings,
  Download,
  Key,
  FileText,
  Search,
  Tag,
  Save,
  Mail,
  HelpCircle,
  ChevronRight,
  Cpu,
  Folder,
  MousePointerClick,
  ListChecks,
  FileImage,
  Keyboard,
  LayoutGrid,
  RefreshCw,
  Info,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Help | GenMeta",
  description: "Learn how to use our image processing platform",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>

        <div className="max-w-7xl mx-auto text-center px-4 relative">
          <Badge
            variant="outline"
            className="mb-6 px-3 py-1 bg-background/80 backdrop-blur-sm border-violet-200 dark:border-violet-800"
          >
            <span className="text-violet-600 dark:text-violet-400 mr-1">
              Documentation
            </span>
            <span>& Support</span>
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            GenMeta{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
              Help Center
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about using GenMeta to enhance your
            image metadata
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
              asChild
            >
              <a href="#quick-start">
                <Sparkles className="mr-2 h-5 w-5" />
                Quick Start Guide
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
              asChild
            >
              <a href="#faq">
                <HelpCircle className="mr-2 h-5 w-5" />
                FAQs
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="guide">
              <Sparkles className="w-4 h-4 mr-2" /> Quick Start
            </TabsTrigger>
            <TabsTrigger value="features">
              <ListChecks className="w-4 h-4 mr-2" /> Features
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="w-4 h-4 mr-2" /> FAQs
            </TabsTrigger>
            <TabsTrigger value="support">
              <Mail className="w-4 h-4 mr-2" /> Support
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Guide Tab */}
          <TabsContent value="guide" id="quick-start">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Quick Start Guide</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Follow these simple steps to get started with GenMeta and
                  begin enhancing your images with AI-powered metadata.
                </p>
              </div>

              {/* Desktop App Guide */}
              <Card className="border-violet-100 dark:border-violet-900 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                  <CardTitle className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    Desktop Application Guide
                  </CardTitle>
                  <CardDescription>
                    Step-by-step instructions for using the GenMeta desktop
                    application
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative">
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-violet-200 via-indigo-300 to-violet-200 dark:from-violet-900 dark:via-indigo-800 dark:to-violet-900 transform -translate-y-1/2 z-0"></div>

                    <div className="grid md:grid-cols-4 gap-8 relative z-10">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-violet-500/20 relative z-10">
                          1
                        </div>
                        <div className="bg-card rounded-xl p-6 border border-violet-100 dark:border-violet-900 shadow-sm hover:shadow-md transition-all duration-300 -mt-8 pt-10">
                          <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
                            <Settings className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Configure
                          </h3>
                          <p className="text-muted-foreground">
                            Click on Settings to configure your API key and
                            preferences
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-violet-500/20 relative z-10">
                          2
                        </div>
                        <div className="bg-card rounded-xl p-6 border border-violet-100 dark:border-violet-900 shadow-sm hover:shadow-md transition-all duration-300 -mt-8 pt-10">
                          <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
                            <Folder className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Select
                          </h3>
                          <p className="text-muted-foreground">
                            Select the directory containing your images using
                            the Browse button
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-violet-500/20 relative z-10">
                          3
                        </div>
                        <div className="bg-card rounded-xl p-6 border border-violet-100 dark:border-violet-900 shadow-sm hover:shadow-md transition-all duration-300 -mt-8 pt-10">
                          <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
                            <Cpu className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Generate
                          </h3>
                          <p className="text-muted-foreground">
                            Click Generate to start the AI processing
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-violet-500/20 relative z-10">
                          4
                        </div>
                        <div className="bg-card rounded-xl p-6 border border-violet-100 dark:border-violet-900 shadow-sm hover:shadow-md transition-all duration-300 -mt-8 pt-10">
                          <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
                            <MousePointerClick className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Review
                          </h3>
                          <p className="text-muted-foreground">
                            View results and open the output directory when
                            processing is complete
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Web App Guide */}
              <Card className="border-violet-100 dark:border-violet-900 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    Web Application Guide
                  </CardTitle>
                  <CardDescription>
                    Step-by-step instructions for using the GenMeta web
                    application
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ol className="space-y-6">
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-semibold shadow-md shadow-violet-500/20">
                        1
                      </span>
                      <div>
                        <h3 className="font-semibold mb-1 text-lg">
                          Create an Account
                        </h3>
                        <p className="text-muted-foreground">
                          Sign up for a free account and get 20 tokens to start
                          processing your images.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-semibold shadow-md shadow-violet-500/20">
                        2
                      </span>
                      <div>
                        <h3 className="font-semibold mb-1 text-lg">
                          Upload Images
                        </h3>
                        <p className="text-muted-foreground">
                          Upload your images individually or in batch. We
                          support JPEG, PNG, and WebP formats.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-semibold shadow-md shadow-violet-500/20">
                        3
                      </span>
                      <div>
                        <h3 className="font-semibold mb-1 text-lg">
                          Process Images
                        </h3>
                        <p className="text-muted-foreground">
                          Our AI will analyze your images and generate metadata.
                          Each image costs 1 token to process.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-semibold shadow-md shadow-violet-500/20">
                        4
                      </span>
                      <div>
                        <h3 className="font-semibold mb-1 text-lg">
                          Download Results
                        </h3>
                        <p className="text-muted-foreground">
                          Download your processed images and metadata in various
                          formats (ZIP, CSV).
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
                <CardFooter className="bg-violet-50/50 dark:bg-violet-950/20 border-t border-violet-100 dark:border-violet-900 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" />
                    <p className="text-sm text-violet-600/80 dark:text-violet-400/80">
                      The web application provides the same powerful features as
                      the desktop app, but with the convenience of browser
                      access from any device.
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  Features & Documentation
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Explore the powerful features of GenMeta and learn how to make
                  the most of them.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Settings Section */}
                <Card className="border-violet-100 dark:border-violet-900">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your GenMeta application for optimal results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Gemini API Key</h3>
                          <p className="text-sm text-muted-foreground">
                            Your Gemini API key for AI image analysis. Required
                            for processing images.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">User ID</h3>
                          <p className="text-sm text-muted-foreground">
                            Your account&apos;s user ID for validating access
                            and tracking usage.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Title Length</h3>
                          <p className="text-sm text-muted-foreground">
                            Number of characters for generated titles.
                            Recommended: 50-60 characters.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Description Length
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Number of characters for descriptions. Recommended:
                            150-160 characters.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Tag className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Keyword Count</h3>
                          <p className="text-sm text-muted-foreground">
                            Number of keywords to generate for each image.
                            Recommended: 20-30 keywords.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Premium User ID
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Enable this for faster processing if you have a
                            premium user ID.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Output Section */}
                <Card className="border-violet-100 dark:border-violet-900">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                    <CardTitle className="flex items-center gap-2">
                      <FileImage className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Output
                    </CardTitle>
                    <CardDescription>
                      Understanding the metadata generated for your images
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="mb-4">
                      Processed images are saved in a{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">
                        processed-images
                      </code>{" "}
                      folder with the following metadata embedded:
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Title</h3>
                          <p className="text-sm text-muted-foreground">
                            A descriptive title for the image, optimized for
                            search engines.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Description</h3>
                          <p className="text-sm text-muted-foreground">
                            Detailed description of image content, providing
                            context and information.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Tag className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Keywords</h3>
                          <p className="text-sm text-muted-foreground">
                            SEO-optimized keywords for the image to improve
                            discoverability.
                          </p>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-6 p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-100 dark:border-violet-900">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
                        Output Formats
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Metadata is embedded directly in the image files and can
                        also be exported as CSV for easy integration with other
                        tools.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Operations Section */}
                <Card className="border-violet-100 dark:border-violet-900">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                    <CardTitle className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Bulk Operations
                    </CardTitle>
                    <CardDescription>
                      Efficiently manage metadata for multiple images at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="mb-4">
                      After processing, you can perform bulk operations on the
                      metadata:
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Save className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Save All Changes
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Save any edits you&apos;ve made to the metadata in
                            one click for all processed images.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Export CSV</h3>
                          <p className="text-sm text-muted-foreground">
                            Export all metadata to a CSV file for easy
                            management and integration with other tools.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Tag className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Common Keyword</h3>
                          <p className="text-sm text-muted-foreground">
                            Add the same keyword to all images at once with
                            flexible positioning:
                          </p>
                          <ul className="list-disc ml-5 mt-2 text-sm text-muted-foreground space-y-1">
                            <li>Place it at the beginning of keywords list</li>
                            <li>Place it at the end of keywords list</li>
                            <li>Insert it at a specific position</li>
                          </ul>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Advanced Features Section */}
                <Card className="border-violet-100 dark:border-violet-900">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Advanced Features
                    </CardTitle>
                    <CardDescription>
                      Get the most out of GenMeta with these powerful features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Search className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Metadata Preview
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Preview generated metadata before saving to ensure
                            it meets your requirements.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Keyboard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Keyboard Shortcuts
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Use keyboard shortcuts for faster navigation and
                            editing of metadata.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <RefreshCw className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Batch Regeneration
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Regenerate metadata for specific images if
                            you&apos;re not satisfied with the initial results.
                          </p>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-6 p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-100 dark:border-violet-900">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
                        Pro Tip
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        For best results, organize your images into folders by
                        theme or subject before processing. This helps the AI
                        generate more consistent and relevant metadata.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faq" id="faq">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Find answers to common questions about GenMeta and its
                  features.
                </p>
              </div>

              <Card className="border-violet-100 dark:border-violet-900">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    Common Questions
                  </CardTitle>
                  <CardDescription>
                    Everything you need to know about using GenMeta
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="item-1"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        What are tokens?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Tokens are our processing credits. Each image you
                        process costs 1 token. New users get 20 free tokens to
                        start. You can purchase additional tokens through our
                        pricing plans to process more images.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-2"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        What image formats are supported?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        We currently support JPEG, PNG, and WebP image formats.
                        Maximum file size is 25MB per image. All processed
                        images maintain their original format and quality, with
                        metadata embedded directly into the file.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-3"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        How accurate is the AI metadata?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Our AI generates highly accurate metadata based on image
                        content. The system uses advanced computer vision and
                        natural language processing to analyze images and create
                        relevant titles, descriptions, and keywords. You can
                        always edit the generated metadata if needed to
                        fine-tune the results.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-4"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        Can I process multiple images at once?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Yes! You can upload and process multiple images in
                        batch. Each image will still cost 1 token. Our system is
                        optimized to handle large batches efficiently, making it
                        perfect for photographers and content creators with
                        extensive image libraries.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-5"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        Do I need a Gemini API key?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Yes, you need a Gemini API key to use the desktop
                        application. You can obtain a free API key from
                        Google&apos;s Gemini platform. The web application has
                        the API key built-in, so you don&apos;t need to provide
                        one when using the web version.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-6"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        Is my data secure?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Yes, we take data security seriously. In the desktop
                        app, all processing happens locally on your device. For
                        the web app, images are temporarily stored for
                        processing and then deleted. We never use your images
                        for training our AI or share them with third parties.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="item-7"
                      className="border-violet-100 dark:border-violet-900"
                    >
                      <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                        What&apos;s the difference between the desktop and web
                        app?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        The desktop app offers more control and processes images
                        locally on your computer, requiring a Gemini API key.
                        The web app is more convenient, accessible from any
                        browser, and doesn&apos;t require an API key. Both
                        provide the same core functionality for generating image
                        metadata.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our support team is here to help you get the most out of
                  GenMeta.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-violet-100 dark:border-violet-900">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Contact Support
                    </CardTitle>
                    <CardDescription>
                      Get in touch with our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-6">
                      If you can&apos;t find the answer you&apos;re looking for,
                      our support team is here to help. We typically respond
                      within 24 hours.
                    </p>
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20"
                      asChild
                    >
                      <a href="mailto:helpgenmeta@gmail.com">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Support
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-violet-100 dark:border-violet-900">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-b border-violet-100 dark:border-violet-900">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Resources
                    </CardTitle>
                    <CardDescription>
                      Additional resources to help you succeed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      <li>
                        <Link
                          href="/blog"
                          className="flex items-center p-3 rounded-lg border border-violet-100 dark:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mr-3 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 transition-colors">
                            <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              Blog & Tutorials
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Tips and guides for using GenMeta effectively
                            </p>
                          </div>
                          <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/video-tutorials"
                          className="flex items-center p-3 rounded-lg border border-violet-100 dark:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mr-3 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 transition-colors">
                            <Video className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              Video Tutorials
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Step-by-step video guides for all features
                            </p>
                          </div>
                          <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/community"
                          className="flex items-center p-3 rounded-lg border border-violet-100 dark:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mr-3 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 transition-colors">
                            <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              Community Forum
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Connect with other users and share tips
                            </p>
                          </div>
                          <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-16">
          <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-8 border border-violet-200 dark:border-violet-800 shadow-lg text-center">
            <Badge className="mb-4 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800">
              Ready to Start?
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Transform Your Image Workflow Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already enhancing their images
              with our AI-powered platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
                asChild
              >
                <Link href="/get-app">
                  <Download className="w-5 h-5 mr-2" />
                  Download Desktop App
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                asChild
              >
                <Link href="/generate/v2">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Web Version
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing components
const Laptop = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"></path>
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" x2="22" y1="12" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const Video = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m22 8-6 4 6 4V8Z"></path>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
