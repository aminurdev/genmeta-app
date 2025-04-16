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
import { getAccessToken } from "@/services/auth-services";
import { getBaseApi } from "@/services/image-services";
import {
  Smartphone,
  Key,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Download,
  Shield,
} from "lucide-react";

export default function GetAppPage() {
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const fetchUserId = async () => {
      const fetchedUserId = await getUserIdFromServer();
      setUserId(fetchedUserId);
    };
    fetchUserId();
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

  return (
    <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Started with GenMeta
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Download the app and generate your App User ID to get started with
            our powerful generation tools
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-3xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          {/* Download Section */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="w-5 h-5" />
                Download the App
              </CardTitle>
              <CardDescription>
                Get the latest version of GenMeta for Windows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                  <div>
                    <p className="font-medium">Windows 10/11 (64-bit)</p>
                    <p className="text-sm text-muted-foreground">
                      Version 3.2.2
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild>
                          <a
                            href="https://github.com/aminurjs/genmeta-app/releases/latest/download/GenMeta-Setup-3.2.2.exe"
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
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border border-border/50">
                  <p className="font-medium mb-2">System Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Windows 10 or 11 (64-bit)</li>
                    <li>4GB RAM minimum</li>
                    <li>500MB free disk space</li>
                    <li>Internet connection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Our application is digitally signed and verified for your
                  security
                </p>
              </div>
            </CardFooter>
          </Card>

          {/* App User ID Section */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Key className="w-5 h-5" />
                Generate Your App User ID
              </CardTitle>
              <CardDescription>
                Create your unique App User ID to connect with GenMeta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Your App User ID</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="userId"
                        value={userId}
                        readOnly
                        placeholder="Click Generate to create your App User ID"
                        className="font-mono"
                      />
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
                            <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  {copied && (
                    <p className="text-sm text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Copied to clipboard!
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleGenerateUserId}
                  className="w-full"
                  disabled={!!userId || isGenerating || isLoading}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </span>
                  ) : userId ? (
                    "App User ID Generated"
                  ) : (
                    "Generate App User ID"
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

                <div className="p-4 bg-muted rounded-lg border border-border/50">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Security Notice</p>
                      <p>
                        Keep this App User ID secure. You&apos;ll need it to
                        authenticate with the app and access your content.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* App Preview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">App Preview</h2>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/Assets/app.png"
              alt="GenMeta App Preview"
              width={1200}
              height={600}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
