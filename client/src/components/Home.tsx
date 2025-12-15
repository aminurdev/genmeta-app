/* eslint-disable @next/next/no-img-element */
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  SparklesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banner } from "@/components/main/banner";

interface Props {
  releaseInfo: {
    version: string;
    downloadUrl: string;
  } | null;
}

export default function HomePage({ releaseInfo }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading and trigger animations
    const loadData = async () => {
      setTimeout(() => setIsLoaded(true), 100);
    };
    loadData();
  }, []);

  const downloadUrl = releaseInfo?.downloadUrl;
  const version = releaseInfo?.version;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>
        <div className="max-w-7xl mx-auto text-center px-4 relative">
          <div
            className={`transform transition-all duration-1000 ease-out ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <Badge
              variant="outline"
              className="mb-6 px-3 py-1 bg-background/80 backdrop-blur-sm border-violet-200 dark:border-violet-800 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="text-violet-600 dark:text-violet-400 mr-1">
                New
              </span>
              <span>Version {version} now available</span>
            </Badge>
          </div>

          <div
            className={`transform transition-all duration-1000 ease-out delay-300 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight max-w-6xl">
              Boost Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 animate-gradient-x">
                Microstock Sales
              </span>{" "}
              with AI Powered Metadata
            </h1>
          </div>

          <div
            className={`transform transition-all duration-1000 ease-out delay-500 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <p className="text-muted-foreground mb-10 max-w-3xl mx-auto ">
              Generate SEO-optimized titles, descriptions, and keywords for
              Adobe Stock, Shutterstock, Freepik, and other microstock
              platforms. Increase your visibility and sales with AI-powered
              metadata
              <br /> that buyers actually search for.
            </p>
          </div>

          <div
            className={`transform transition-all duration-1000 ease-out delay-700 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 group transform hover:scale-105 transition-all duration-300"
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
                className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 group bg-transparent transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="/pricing">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          <div
            className={`transform transition-all duration-1000 ease-out delay-900 ${
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
      <AnimatedSection delay={1000}>
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800 animate-fade-in-up"
              >
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
                Maximize Your Microstock Revenue
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
                Professional tools designed specifically for stock photographers
                to increase discoverability and sales on major platforms
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Microstock-Optimized AI",
                  description:
                    "Generate titles, descriptions, and keywords specifically optimized for Adobe Stock, Shutterstock, and Freepik algorithms to maximize your sales potential.",
                  icon: SparklesIcon,
                },
                {
                  title: "Bulk Files Processing",
                  description:
                    "Process thousands of stock images at once with platform-specific metadata templates. Perfect for large files uploads and files optimization.",
                  icon: ArrowPathIcon,
                },
                {
                  title: "Secure & Private",
                  description:
                    "Your valuable stock images never leave your computer. All AI processing happens locally with secure API connections, protecting your intellectual property.",
                  icon: ShieldCheckIcon,
                },
                {
                  title: "High-Converting Keywords",
                  description:
                    "Generate trending keywords that buyers actually search for on microstock platforms. Increase your image visibility and download rates.",
                  icon: ListBulletIcon,
                },
                {
                  title: "Platform-Specific Settings",
                  description:
                    "Customize metadata output for different platforms with Adobe Stock's 50-keyword limit, Shutterstock's requirements, and Freepik's optimization needs.",
                  icon: Cog6ToothIcon,
                },
                {
                  title: "Professional Export",
                  description:
                    "Export ready-to-upload CSV files or embed metadata directly into images. Streamline your microstock submission workflow.",
                  icon: DocumentTextIcon,
                },
              ].map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Quick Setup Guide Section */}
      <AnimatedSection delay={1300}>
        <section className="py-24 bg-gradient-to-b from-background to-violet-50/30 dark:to-violet-950/10">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-20">
              <Badge
                variant="outline"
                className="mb-6 px-4 py-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 animate-fade-in-up"
              >
                <SparklesIcon className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
                Quick Setup Guide
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in-up">
                Start Generating Professional Metadata in{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
                  5 Minutes
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
                Transform your microstock workflow with our streamlined setup
                process. From installation to your first AI-generated metadata
                in just a few clicks.
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Download & Install GenMeta",
                  description:
                    "Download GenMeta-Setup-5.3.2.exe and run the installer. Windows Defender may show a security warning - click 'Run anyway' to proceed with the installation.",
                  details: [
                    "Windows security bypass",
                    "One-click installer",
                    "Desktop shortcut created",
                  ],
                  icon: Download,
                  color: "from-blue-500 to-cyan-500",
                  image: "/Assets/quick-setup/2.png",
                },
                {
                  step: "02",
                  title: "Configure API Settings",
                  description:
                    "Open GenMeta and navigate to Settings > System Configuration. Enter your Gemini API key in the API Configuration section to enable AI metadata generation.",
                  details: [
                    "Secure API integration",
                    "Up to 5 API keys supported",
                    "Automatic quota rotation",
                  ],
                  icon: Cog6ToothIcon,
                  color: "from-violet-500 to-purple-500",
                  image: "/Assets/quick-setup/3.png",
                },
                {
                  step: "03",
                  title: "Install Ghostscript (Optional)",
                  description:
                    "For EPS file processing, install Ghostscript by clicking the 'Install Ghostscript' button in the settings. This enables full support for vector graphics and EPS files.",
                  details: [
                    "EPS file support",
                    "Vector graphics processing",
                    "Automatic detection",
                  ],
                  icon: ShieldCheckIcon,
                  color: "from-emerald-500 to-teal-500",
                  image: "/Assets/quick-setup/3.png",
                },
                {
                  step: "04",
                  title: "Select Your Image Files",
                  description:
                    "Click 'Select Files' or 'Select Folder' to choose your images. GenMeta supports EPS, PNG, JPG and other formats. Select multiple files for batch processing.",
                  details: [
                    "Multiple format support",
                    "Batch file selection",
                    "Folder processing",
                  ],
                  icon: SparklesIcon,
                  color: "from-orange-500 to-red-500",
                  image: "/Assets/quick-setup/4.png",
                },
                {
                  step: "05",
                  title: "Generate & Review Metadata",
                  description:
                    "Click 'Generate Metadata' and watch AI create optimized titles, descriptions, and keywords. Review results, make edits, and export for Adobe Stock, Shutterstock, and other platforms.",
                  details: [
                    "AI-powered generation",
                    "Editable results",
                    "Multi-platform export",
                  ],
                  icon: DocumentTextIcon,
                  color: "from-pink-500 to-rose-500",
                  image: "/Assets/quick-setup/5.png",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`group relative transform transition-all duration-700 ease-out ${
                    index % 2 === 0
                      ? "animate-fade-in-left"
                      : "animate-fade-in-right"
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="relative bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Step number gradient background */}
                    <div
                      className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${item.color}`}
                    ></div>

                    <div className="p-8 md:p-10">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                        {/* Content Section */}
                        <div className="flex-1 space-y-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} shadow-lg`}
                            >
                              <item.icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                                Step {item.step}
                              </div>
                              <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                {item.title}
                              </h3>
                            </div>
                          </div>

                          <p className="text-lg text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {item.details.map((detail, detailIndex) => (
                              <div
                                key={detailIndex}
                                className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="lg:w-96 xl:w-[500px]">
                          <div className="relative rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={`Step ${item.step}: ${item.title}`}
                              className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] bg-white dark:bg-gray-900"
                              style={{ minHeight: "280px" }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection line for desktop */}
                  {index < 4 && (
                    <div className="hidden lg:block absolute left-8 -bottom-4 w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-400/10 dark:to-indigo-400/10 rounded-2xl p-8 border border-violet-200 dark:border-violet-800">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Transform Your Microstock Business?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join thousands of stock photographers who have increased their
                  earnings with AI-powered metadata optimization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 transform hover:scale-105 transition-all duration-300"
                    asChild
                  >
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download GenMeta Now
                      <Badge
                        variant="outline"
                        className="ml-2 bg-white/20 border-white/30 text-white"
                      >
                        Free
                      </Badge>
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 transform hover:scale-105 transition-all duration-300 bg-transparent"
                    asChild
                  >
                    <Link href="/pricing">
                      <Crown className="w-5 h-5 mr-2" />
                      View Pro Features
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Settings Section */}
      <AnimatedSection delay={1400}>
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800 animate-fade-in-up"
              >
                Customization
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
                Flexible Configuration Options
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
                Tailor GenMeta desktop app to your specific workflow needs
              </p>
            </div>
            <div className="animate-fade-in-up">
              <Tabs defaultValue="api" className="w-full max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger
                    value="api"
                    className="transition-all duration-300 hover:scale-105"
                  >
                    API Configuration
                  </TabsTrigger>
                  <TabsTrigger
                    value="output"
                    className="transition-all duration-300 hover:scale-105"
                  >
                    Output Settings
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="api"
                  className="p-6 bg-card rounded-xl border border-border shadow-sm transform transition-all duration-500 hover:shadow-md"
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
                        icon={
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        }
                      />
                      <SettingItem
                        title="Secure Processing"
                        description="All API calls are made securely from your desktop application"
                        icon={
                          <ShieldCheckIcon className="w-5 h-5 text-violet-500" />
                        }
                      />
                      <SettingItem
                        title="Rate Limiting"
                        description="Built-in rate limiting to respect API quotas and limits"
                        icon={
                          <ChartBarIcon className="w-5 h-5 text-violet-500" />
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent
                  value="output"
                  className="p-6 bg-card rounded-xl border border-border shadow-sm transform transition-all duration-500 hover:shadow-md"
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
          </div>
        </section>
      </AnimatedSection>

      {/* Bulk Operations Section */}
      <AnimatedSection delay={1600}>
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800 animate-fade-in-up"
              >
                Desktop Power
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
                Scale Your Microstock Business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
                Professional portfolio management tools designed for serious
                stock photographers and content creators
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Unlimited Files Processing",
                  description:
                    "Process your entire stock files with no image limits. Scale from hundreds to hundreds of thousands of images for maximum earning potential.",
                  icon: ArrowPathIcon,
                },
                {
                  title: "Multi-Platform Export",
                  description:
                    "Export optimized metadata for Adobe Stock, Shutterstock, Freepik, and other platforms simultaneously. Save hours of manual work.",
                  icon: DocumentTextIcon,
                },
                {
                  title: "Trending Keywords Database",
                  description:
                    "Access AI-curated trending keywords and add your own high-performing terms to boost discoverability across all platforms.",
                  icon: ListBulletIcon,
                },
              ].map((feature, index) => (
                <BulkFeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Testimonials Section */}
      <AnimatedSection delay={1800}>
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800 animate-fade-in-up"
              >
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
                Real Results from Stock Photographers
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
                Join thousands of successful contributors who have boosted their
                microstock earnings with AI-powered metadata
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    "My Adobe Stock earnings increased by 45% in just 3 months! GenMeta's AI generates keywords that buyers actually search for. It's like having a microstock expert on my team.",
                  author: "Sarah J.",
                  role: "Adobe Stock Contributor",
                },
                {
                  quote:
                    "I went from 200 to 2,000 downloads per month on Shutterstock after using GenMeta. The platform-specific optimization really works - my images now rank higher in search results.",
                  author: "Michael T.",
                  role: "Professional Stock Photographer",
                },
                {
                  quote:
                    "Processing 5,000+ images for my Freepik portfolio used to take weeks. Now it takes hours, and my acceptance rate improved from 60% to 95%. This tool pays for itself!",
                  author: "Elena R.",
                  role: "Digital Content Creator",
                },
              ].map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.author}
                  quote={testimonial.quote}
                  author={testimonial.author}
                  role={testimonial.role}
                  delay={index * 150}
                />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection delay={2000}>
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background -z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>
          <div className="max-w-4xl mx-auto text-center px-4">
            <Badge
              variant="outline"
              className="mb-6 px-3 py-1 border-violet-200 dark:border-violet-800 animate-fade-in-up"
            >
              Get Started Today
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground animate-fade-in-up">
              Ready to Boost Your Microstock Revenue?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up">
              Join thousands of successful stock photographers earning more with
              AI-optimized metadata. Start your free trial and see results in
              your first week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5 mr-2" />
                  Start Earning More Today
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 bg-transparent transform hover:scale-105 transition-all duration-300"
                asChild
              >
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
      className={`transform transition-all duration-1000 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <Card
      className="overflow-hidden group hover:shadow-lg transition-all duration-500 border-violet-100 dark:border-violet-900 h-full transform hover:scale-105 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-4 group-hover:bg-violet-500 transition-all duration-300 group-hover:scale-110">
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
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <Card
      className="overflow-hidden group hover:shadow-lg transition-all duration-500 border-violet-100 dark:border-violet-900 h-full bg-gradient-to-br from-white to-violet-50 dark:from-background dark:to-violet-950/20 transform hover:scale-105 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500 transition-all duration-300 group-hover:scale-110">
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
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 hover:scale-105">
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
  delay = 0,
}: {
  quote: string;
  author: string;
  role: string;
  delay?: number;
}) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-500 border-violet-100 dark:border-violet-900 h-full transform hover:scale-105 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="text-violet-500 mb-4 transform hover:scale-110 transition-transform duration-300">
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
          <div className="animate-fade-in-up">
            <div className="mb-4 w-52">
              <Link
                href="/"
                className="transform hover:scale-105 transition-transform duration-300 inline-block"
              >
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
              Transform your images with our powerful desktop application
              featuring advanced AI technology and professional-grade metadata
              tools.
            </p>
            <div className="flex space-x-4 mt-4">
              {[
                // Facebook
                <svg
                  key="facebook"
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
                </svg>,
                // Twitter
                <svg
                  key="twitter"
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
                </svg>,
                // Instagram
                <svg
                  key="instagram"
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
                </svg>,
              ].map((icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transform hover:scale-110 transition-all duration-300"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <h4 className="text-lg font-semibold mb-4 text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-3 text-muted-foreground">
              {[
                { href: "/docs", label: "Docs" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/pricing", label: "Pricing" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300 flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <h4 className="text-lg font-semibold mb-4 text-foreground">
              Resources
            </h4>
            <ul className="space-y-3 text-muted-foreground">
              {[
                { href: "/terms", label: "Terms & Conditions" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/download", label: "Get APP" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300 flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <h4 className="text-lg font-semibold mb-4 text-foreground">
              Contact
            </h4>
            <ul className="space-y-3 text-muted-foreground">
              {" "}
              <li className="flex items-center group">
                <Phone className="w-4 h-4 mr-2 text-violet-500 group-hover:scale-110 transition-transform" />

                <a
                  href="https://wa.me/+8801817710493"
                  className="text-violet-600 dark:text-violet-400 hover:underline transition-all duration-300"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center group">
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
                  className="mr-2 text-violet-500 group-hover:scale-110 transition-transform"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a
                  href="mailto:support@genmeta.app"
                  className="text-violet-600 dark:text-violet-400 hover:underline transition-all duration-300"
                >
                  support@genmeta.app
                </a>
              </li>
              <li className="flex items-center group">
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
                  className="mr-2 text-violet-500 group-hover:scale-110 transition-transform"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Rangpur, Dhaka, Bangladesh
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-violet-100 dark:border-violet-900 text-center text-muted-foreground animate-fade-in-up">
          <p>&copy; {new Date().getFullYear()} GenMeta. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
