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

const AuthErrorCard = async ({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) => {
  const { error } = await searchParams;
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
          <p className="text-sm text-muted-foreground font-medium">{error}</p>
          {/* <div className="bg-muted/20 p-3 rounded-md text-xs space-y-2">
            <p className="font-semibold">Troubleshooting tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Clear your browser cookies and cache</li>
              <li>Try using a different browser</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div> */}
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
