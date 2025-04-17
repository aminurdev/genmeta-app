"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getAccessToken } from "@/services/auth-services";
import { getBaseApi } from "@/services/image-services";
import {
  Key,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Download,
  Shield,
  Info,
  ArrowRight,
  Laptop,
  RefreshCw,
} from "lucide-react";
import { getLatestRelease } from "@/app/(public)/page";

export default function GetAppPage() {
  const [userId, setUserId] = useState<string>("");
  const [hideUserId, setHideUserId] = useState<boolean>(true);

  interface ReleaseInfo {
    version: string;
    downloadUrl: string;
  }

  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("setup");

  const getUserIdFromServer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseAPI = await getBaseApi();
      const accessToken = await getAccessToken();

      if (!baseAPI || !accessToken) {
        throw new Error("Failed to initialize API connection");
      }

      const response = await fetch(`${baseAPI}/users/userid`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Server error: ${response.status}`
        );
      }

      const data = await response.json();
      return data.data?.data?.[0]?.key;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user ID");
      return "";
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedUserId, releaseData] = await Promise.allSettled([
          getUserIdFromServer(),
          getLatestRelease(),
        ]);

        if (fetchedUserId.status === "fulfilled") {
          setUserId(fetchedUserId.value);
        }

        if (releaseData.status === "fulfilled" && releaseData.value) {
          setReleaseInfo({
            version: releaseData.value.version,
            downloadUrl: releaseData.value.downloadUrl,
          });
        } else {
          setError("Failed to fetch latest release information");
        }
      } catch {
        setError("Failed to initialize application data");
      }
    };

    fetchData();
  }, []);

  const handleGenerateUserId = async () => {
    if (userId) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const baseAPI = await getBaseApi();
      const accessToken = await getAccessToken();

      if (!baseAPI || !accessToken) {
        throw new Error("Failed to initialize API connection");
      }

      const response = await fetch(`${baseAPI}/users/userid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success && data.data?.data?.key) {
        setUserId(data.data.data.key);
        // Auto-switch to the setup tab after successful generation
        setActiveTab("setup");
      } else {
        throw new Error("Failed to generate user ID");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate user ID"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUserId = () => {
    if (!userId) return;

    navigator.clipboard
      .writeText(userId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setError("Failed to copy to clipboard");
      });
  };

  const handleRetry = async () => {
    setError(null);
    const fetchedUserId = await getUserIdFromServer();
    setUserId(fetchedUserId);

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

  return (
    <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Get Started with GenMeta
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Follow these simple steps to set up and start using our powerful
            generation tools
          </p>
        </div>

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

        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-6 bg-muted/50 rounded-lg border border-border/50 mb-8">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                1
              </div>
              <span>Download the app</span>
            </div>
            <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                2
              </div>
              <span>Generate your App User ID</span>
            </div>
            <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                3
              </div>
              <span>Enter ID in the app</span>
            </div>
          </div>

          <Tabs
            defaultValue="setup"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="download" className="text-sm md:text-base">
                <Laptop className="w-4 h-4 mr-2" /> Download
              </TabsTrigger>
              <TabsTrigger value="setup" className="text-sm md:text-base">
                <Key className="w-4 h-4 mr-2" /> App User ID
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-sm md:text-base">
                <Laptop className="w-4 h-4 mr-2" /> App Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="mt-0">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Laptop className="w-6 h-6" />
                      Download GenMeta
                    </CardTitle>
                    {releaseInfo?.version && (
                      <Badge variant="outline" className="text-xs">
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
                      <div className="flex items-center justify-between p-5 bg-muted rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <div>
                          <p className="font-medium text-lg">
                            Windows 10/11 (64-bit)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Recommended for most users
                          </p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild size="lg">
                                <a
                                  href={releaseInfo?.downloadUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download the latest version</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-600">
                            After downloading:
                          </p>
                          <ol className="list-decimal ml-5 mt-1 text-sm text-green-600/90 space-y-1">
                            <li>
                              Run the installer and follow the on-screen
                              instructions
                            </li>
                            <li>Launch GenMeta after installation</li>
                            <li>
                              You&apos;ll need your App User ID to activate the
                              application
                            </li>
                          </ol>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start text-sm text-muted-foreground border-t pt-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Our application is digitally signed and verified for your
                      security
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto"
                    onClick={() => setActiveTab("setup")}
                  >
                    Next: Generate your App User ID{" "}
                    <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="setup" className="mt-0">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Key className="w-6 h-6" />
                    Generate Your App User ID
                  </CardTitle>
                  <CardDescription className="text-base">
                    Create your unique App User ID to connect with GenMeta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId" className="text-base">
                        Your App User ID
                      </Label>
                      {isLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="userId"
                              value={
                                userId
                                  ? hideUserId
                                    ? "•".repeat(userId.length)
                                    : userId
                                  : ""
                              }
                              readOnly
                              placeholder="Click Generate to create your App User ID"
                              className="font-mono pr-10"
                            />
                            {userId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setHideUserId(!hideUserId)}
                              >
                                {hideUserId ? (
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
                                    className="lucide lucide-eye"
                                  >
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                ) : (
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
                                    className="lucide lucide-eye-off"
                                  >
                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                    <line x1="2" x2="22" y1="2" y2="22" />
                                  </svg>
                                )}
                              </Button>
                            )}
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={handleCopyUserId}
                                  disabled={!userId}
                                >
                                  {copied ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copied ? "Copied!" : "Copy to clipboard"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      {copied && (
                        <p className="text-sm text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Copied to
                          clipboard!
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleGenerateUserId}
                      className="w-full"
                      size="lg"
                      disabled={!!userId || isGenerating || isLoading}
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </span>
                      ) : userId ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          App User ID Generated
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Generate App User ID
                        </span>
                      )}
                    </Button>

                    {showWarning && (
                      <Alert
                        variant="default"
                        className="bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                      >
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-600">
                          Important
                        </AlertTitle>
                        <AlertDescription className="text-yellow-600">
                          You can only generate one App User ID. Please keep it
                          secure.
                        </AlertDescription>
                      </Alert>
                    )}

                    {userId && (
                      <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <h3 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4" /> Next Steps
                        </h3>
                        <ol className="list-decimal ml-5 text-sm text-green-600/90 space-y-1">
                          <li>Copy your App User ID using the button above</li>
                          <li>
                            Launch the GenMeta application on your computer
                          </li>
                          <li>
                            Paste your App User ID when prompted during first
                            launch
                          </li>
                          <li>
                            Your app will automatically connect to your account
                          </li>
                        </ol>
                      </div>
                    )}

                    <div className="p-5 bg-muted rounded-lg border border-border/50">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
                        <div>
                          <p className="font-medium mb-1">Security Notice</p>
                          <p className="text-sm text-muted-foreground">
                            Keep this App User ID secure. You&apos;ll need it to
                            authenticate with the app and access your content.
                            This ID cannot be recovered if lost, so store it in
                            a safe place.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto"
                    onClick={() => setActiveTab("download")}
                  >
                    <ArrowRight className="mr-1 w-3 h-3 rotate-180" /> Back to
                    Download
                  </Button>
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto"
                    onClick={() => setActiveTab("preview")}
                  >
                    View App Preview <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Laptop className="w-6 h-6" />
                    App Preview
                  </CardTitle>
                  <CardDescription className="text-base">
                    See what GenMeta looks like and what you can do with it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg overflow-hidden shadow-xl border border-border">
                    <Image
                      src="/Assets/app.png"
                      alt="GenMeta App Preview"
                      width={1200}
                      height={600}
                      className="w-full h-auto"
                      priority
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-muted rounded-lg border border-border/50">
                      <h3 className="font-medium mb-2">Powerful Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        Create high-quality content with our advanced AI models
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border border-border/50">
                      <h3 className="font-medium mb-2">Intuitive Interface</h3>
                      <p className="text-sm text-muted-foreground">
                        Easy-to-use controls designed for both beginners and
                        experts
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border border-border/50">
                      <h3 className="font-medium mb-2">Cloud Sync</h3>
                      <p className="text-sm text-muted-foreground">
                        Your content syncs across devices with your account
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto"
                    onClick={() => setActiveTab("setup")}
                  >
                    <ArrowRight className="mr-1 w-3 h-3 rotate-180" /> Back to
                    App User ID
                  </Button>
                  {!userId && (
                    <Button
                      variant="link"
                      className="text-sm p-0 h-auto text-primary"
                      onClick={() => setActiveTab("setup")}
                    >
                      Generate your App User ID{" "}
                      <ArrowRight className="ml-1 w-3 h-3" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="p-5 bg-muted/50 rounded-lg border border-border/50">
              <h3 className="font-medium mb-2">What is an App User ID?</h3>
              <p className="text-sm text-muted-foreground">
                The App User ID is a unique identifier that connects your web
                account with the desktop application. It allows you to access
                your content and settings across platforms.
              </p>
            </div>
            <div className="p-5 bg-muted/50 rounded-lg border border-border/50">
              <h3 className="font-medium mb-2">
                Can I use GenMeta on multiple computers?
              </h3>
              <p className="text-sm text-muted-foreground">
                No, your App User ID can only be used on one device at a time.
                If you need to use GenMeta on a different computer, you&apos;ll
                need to log out from your current device first. This restriction
                helps protect your account security.
              </p>
            </div>
            <div className="p-5 bg-muted/50 rounded-lg border border-border/50">
              <h3 className="font-medium mb-2">
                What if I lose my App User ID?
              </h3>
              <p className="text-sm text-muted-foreground">
                If you lose your App User ID, you can return to this page while
                logged in to view it. We recommend storing it in a secure
                password manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
