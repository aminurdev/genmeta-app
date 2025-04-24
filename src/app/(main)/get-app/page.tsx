"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Shield,
  Info,
  ArrowRight,
  Laptop,
  RefreshCw,
  CheckCircle,
  type LucideIcon,
  HelpCircle,
  Cpu,
  Cloud,
  Lock,
  Settings,
  ImageIcon,
  FileText,
} from "lucide-react";
import { getLatestRelease } from "@/app/(public)/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Feature type definition
interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

// FAQ type definition
interface FAQ {
  question: string;
  answer: string;
}

export default function GetAppPage() {
  const [activeTab, setActiveTab] = useState<string>("download");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const downloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  interface ReleaseInfo {
    version: string;
    downloadUrl: string;
  }

  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Features list
  const features: Feature[] = [
    {
      icon: Cpu,
      title: "AI-Powered Analysis",
      description:
        "Generate accurate titles, descriptions, and SEO-optimized keywords using Gemini AI technology.",
    },
    {
      icon: ImageIcon,
      title: "Batch Processing",
      description:
        "Process entire directories of images at once with customizable metadata settings.",
    },
    {
      icon: FileText,
      title: "Flexible Export",
      description:
        "Export metadata to CSV or save directly to processed images with embedded metadata.",
    },
    {
      icon: Lock,
      title: "Secure Processing",
      description:
        "All processing happens locally on your device, ensuring your data never leaves your computer.",
    },
    {
      icon: Settings,
      title: "Customizable Settings",
      description:
        "Tailor the output to your specific needs with adjustable title length, description depth, and keyword count.",
    },
    {
      icon: Cloud,
      title: "Cloud Integration",
      description:
        "Seamlessly save your metadata to cloud services or export for use in other applications.",
    },
  ];

  // FAQ list - removed user ID related FAQs
  const faqs: FAQ[] = [
    {
      question: "Can I use GenMeta on multiple computers?",
      answer:
        "Yes, you can install GenMeta on multiple computers. Each installation will function independently.",
    },
    {
      question: "Do I need to be online to use GenMeta?",
      answer:
        "GenMeta requires an internet connection for initial activation and for AI-powered features. However, basic metadata editing functions can work offline.",
    },
    {
      question: "How do I update to the latest version?",
      answer:
        "GenMeta includes an auto-update feature that will notify you when a new version is available. You can also return to this page anytime to download the latest version manually.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, GenMeta processes your images locally on your device. Your images are never uploaded to our servers unless you explicitly use cloud backup features. Your metadata is stored securely and encrypted during any transmission.",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const releaseData = await getLatestRelease();

        if (releaseData) {
          setReleaseInfo({
            version: releaseData.version,
            downloadUrl: releaseData.downloadUrl,
          });
        } else {
          setError("Failed to fetch latest release information");
        }
        setIsLoading(false);
      } catch {
        setError("Failed to initialize application data");
        setIsLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      if (downloadTimerRef.current) {
        clearInterval(downloadTimerRef.current);
      }
    };
  }, []);

  // Update active tab when step changes
  useEffect(() => {
    if (currentStep === 1) setActiveTab("download");
    else if (currentStep === 2) setActiveTab("preview");
  }, [currentStep]);

  const handleRetry = async () => {
    setError(null);
    try {
      const releaseInfo = await getLatestRelease();
      if (releaseInfo) {
        setReleaseInfo({
          version: releaseInfo.version,
          downloadUrl: releaseInfo.downloadUrl,
        });
      }
    } catch {
      setError("Failed to refresh release information");
    }
  };

  const simulateDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    downloadTimerRef.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          if (downloadTimerRef.current) {
            clearInterval(downloadTimerRef.current);
          }
          setIsDownloading(false);
          setDownloadComplete(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const goToNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
              New
            </span>
            <span>Version {releaseInfo?.version} now available</span>
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Get Started with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
              GenMeta
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Follow these simple steps to set up and start using our powerful
            AI-powered metadata generation tools
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {error && (
          <Alert variant="destructive" className="mb-8 max-w-3xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps - Modified to have only 2 steps */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-violet-200 via-indigo-300 to-violet-200 dark:from-violet-900 dark:via-indigo-800 dark:to-violet-900 transform -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`flex flex-col items-center text-center relative z-10 ${
                  currentStep >= 1 ? "opacity-100" : "opacity-50"
                }`}
                onClick={() => setCurrentStep(1)}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    currentStep >= 1
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "bg-muted text-muted-foreground"
                  } mb-3 transition-all duration-300 cursor-pointer`}
                >
                  {currentStep > 1 ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </div>
                <h3
                  className={`font-medium ${
                    currentStep === 1
                      ? "text-violet-600 dark:text-violet-400"
                      : ""
                  }`}
                >
                  Download App
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get the latest version
                </p>
              </div>

              <div
                className={`flex flex-col items-center text-center relative z-10 ${
                  currentStep >= 2 ? "opacity-100" : "opacity-50"
                }`}
                onClick={() => setCurrentStep(2)}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    currentStep >= 2
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "bg-muted text-muted-foreground"
                  } mb-3 transition-all duration-300 cursor-pointer`}
                >
                  <Laptop className="h-5 w-5" />
                </div>
                <h3
                  className={`font-medium ${
                    currentStep === 2
                      ? "text-violet-600 dark:text-violet-400"
                      : ""
                  }`}
                >
                  App Preview
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  See what&apos;s included
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-5xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger
              value="download"
              className="text-sm md:text-base"
              onClick={() => setCurrentStep(1)}
            >
              <Download className="w-4 h-4 mr-2" /> Download
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-sm md:text-base"
              onClick={() => setCurrentStep(2)}
            >
              <Laptop className="w-4 h-4 mr-2" /> App Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="download" className="mt-0">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-violet-100 dark:border-violet-900 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Laptop className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    Download GenMeta
                  </CardTitle>
                  {releaseInfo?.version && (
                    <Badge
                      variant="outline"
                      className="text-xs border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30"
                    >
                      v{releaseInfo.version}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-base">
                  Get the latest version of GenMeta for your system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row items-stretch gap-4">
                      <div className="flex-1 p-5 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-background rounded-lg border border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 transition-colors shadow-sm hover:shadow-md">
                        <div className="flex flex-col h-full">
                          <div className="mb-4">
                            <Badge className="bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800">
                              Recommended
                            </Badge>
                          </div>
                          <h3 className="font-medium text-lg mb-1">
                            Windows 10/11 (64-bit)
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Latest version with all features
                          </p>

                          {isDownloading ? (
                            <div className="mt-auto space-y-2">
                              <Progress
                                value={downloadProgress}
                                className="h-2 bg-violet-100 dark:bg-violet-900/50 relative overflow-hidden"
                                style={{
                                  background:
                                    "linear-gradient(to right, #7c3aed, #4f46e5)",
                                }}
                              />
                              <p className="text-xs text-center text-muted-foreground">
                                Downloading... {downloadProgress}%
                              </p>
                            </div>
                          ) : downloadComplete ? (
                            <div className="mt-auto">
                              <Button
                                className="w-full bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => {
                                  setDownloadComplete(false);
                                  goToNextStep();
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Download Complete
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-auto">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20"
                                      onClick={() => {
                                        simulateDownload();
                                        window.open(
                                          releaseInfo?.downloadUrl,
                                          "_blank"
                                        );
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download for Windows
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Download version {releaseInfo?.version}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg">
                      <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-violet-600 dark:text-violet-400">
                          After downloading:
                        </p>
                        <ol className="list-decimal ml-5 mt-1 text-sm text-violet-600/90 dark:text-violet-400/90 space-y-1">
                          <li>
                            Run the installer and follow the on-screen
                            instructions
                          </li>
                          <li>Launch GenMeta after installation</li>
                          <li>Start using the application immediately</li>
                        </ol>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start text-sm text-muted-foreground border-t border-violet-100 dark:border-violet-900 pt-4">
                <div className="flex items-start gap-2 mb-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-violet-600 dark:text-violet-400" />
                  <p>
                    Our application is digitally signed and verified for your
                    security
                  </p>
                </div>
                <div className="flex justify-between w-full">
                  <div></div>
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                    onClick={goToNextStep}
                  >
                    Next: App Preview <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-violet-100 dark:border-violet-900 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Laptop className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  App Preview
                </CardTitle>
                <CardDescription className="text-base">
                  See what GenMeta looks like and what you can do with it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative rounded-lg overflow-hidden shadow-xl border border-violet-200 dark:border-violet-800 group">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-start justify-center">
                    <Badge className="mt-4 bg-violet-600 text-white">
                      GenMeta Desktop Interface
                    </Badge>
                  </div>
                  <Image
                    src="/Assets/app.png"
                    alt="GenMeta App Preview"
                    width={1200}
                    height={600}
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-background rounded-lg border border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:shadow-md group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3 group-hover:bg-violet-500 transition-colors duration-300">
                        <feature.icon className="w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h3 className="font-medium mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-violet-100 dark:border-violet-900 pt-4">
                <Button
                  variant="outline"
                  className="text-sm border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                  onClick={goToPreviousStep}
                >
                  <ArrowRight className="mr-1 w-3 h-3 rotate-180" /> Back to
                  Download
                </Button>
                <Button
                  className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  onClick={() =>
                    window.open(releaseInfo?.downloadUrl, "_blank")
                  }
                >
                  <Download className="mr-1 w-3 h-3" /> Download Now
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-24">
          <div className="text-center mb-12">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-violet-200 dark:border-violet-800"
            >
              Support
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about GenMeta installation and
              setup
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border-violet-100 dark:border-violet-900"
              >
                <AccordionTrigger className="hover:text-violet-600 dark:hover:text-violet-400">
                  <div className="flex items-center gap-2 text-left">
                    <HelpCircle className="w-5 h-5 text-violet-500 flex-shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-24">
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
                onClick={() => window.open(releaseInfo?.downloadUrl, "_blank")}
              >
                <Download className="w-5 h-5 mr-2" />
                Download GenMeta
                {releaseInfo?.version && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-white/20 border-white/30 text-white"
                  >
                    v{releaseInfo.version}
                  </Badge>
                )}
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Need help?{" "}
              <Link
                href="/help"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
