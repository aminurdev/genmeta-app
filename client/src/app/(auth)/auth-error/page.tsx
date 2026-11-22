import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state:
    "Your sign-in session could not be verified or has expired. Please try again.",
  auth_failed:
    "Google authentication failed. Please try signing in again.",
  account_disabled:
    "Your account has been disabled. Please contact support.",
  server_error:
    "An unexpected server error occurred during sign-in. Please try again.",
};

const AuthErrorCard = async ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) => {
  const { error } = await searchParams;
  const displayError =
    (error && ERROR_MESSAGES[error]) ||
    error ||
    "Authentication could not be completed. Please try again.";
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <Card className="w-full max-w-md shadow-lg border-destructive/20">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center text-destructive gap-2">
            <AlertTriangle className="h-5 w-5" />
            Authentication Error
          </CardTitle>
        </CardHeader>
        <Separator className="mb-4" />
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            {displayError}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="default" className="w-full">
              Back to Login
            </Button>
          </Link>
          <a href="mailto:support@genmeta.app" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthErrorCard;
