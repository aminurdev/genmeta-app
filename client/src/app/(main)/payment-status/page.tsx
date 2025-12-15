import {
  CheckCircle,
  ArrowLeft,
  Laptop,
  Receipt,
  Calendar,
  CreditCard,
  Sparkles,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function PaymentStatus({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    amount?: string;
    plan?: string;
    status?: string;
    planType?: string;
    duration?: string;
    credit?: string;
    trxID?: string;
  }>;
}) {
  const { message, amount, plan, status, planType, duration, credit, trxID } =
    await searchParams;

  const isSuccess = status === "success";
  const isCreditPlan = planType === "credit";

  // Format duration for display
  const formatDuration = (days: string | undefined) => {
    if (!days) return "";
    const numDays = parseInt(days);
    if (numDays >= 365)
      return `${Math.floor(numDays / 365)} Year${numDays >= 730 ? "s" : ""}`;
    if (numDays >= 30)
      return `${Math.floor(numDays / 30)} Month${numDays >= 60 ? "s" : ""}`;
    return `${numDays} Day${numDays > 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-950">
      <div className="w-full max-w-5xl">
        {/* Success Animation Card */}
        <Card className="border-2 border-green-200 dark:border-green-800 shadow-2xl overflow-hidden">
          {/* Header with animated gradient */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-background p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

            <CardHeader className="flex flex-col items-center gap-4 p-0 relative z-10">
              {/* Animated success icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 bg-emerald-300/20 rounded-full animate-pulse"></div>
                <div className="relative rounded-full p-4 bg-white shadow-xl ring-4 ring-emerald-200/50">
                  <CheckCircle className="h-16 w-16 text-green-500 animate-[scale-in_0.5s_ease-out]" />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground drop-shadow-sm">
                  Payment Successful!
                </h1>
                <p className="text-muted-foreground text-lg">
                  {message || "Your payment has been processed successfully"}
                </p>
              </div>
            </CardHeader>
          </div>

          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {isSuccess && amount && plan && (
              <>
                {/* Transaction Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2>Transaction Details</h2>
                  </div>

                  <div className="rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 space-y-4">
                    {trxID && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Transaction ID
                        </span>
                        <span className="font-mono font-semibold text-sm bg-background px-3 py-1 rounded-md border">
                          {trxID}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Amount Paid
                      </span>
                      <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                        ${amount}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Plan Type</span>
                      <span className="font-semibold capitalize px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300">
                        {planType || "Subscription"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2>Plan Details</h2>
                  </div>

                  <div className="rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Plan Name</span>
                      <span className="font-bold text-lg capitalize text-foreground">
                        {plan}
                      </span>
                    </div>

                    {duration && (
                      <>
                        <Separator className="bg-green-200 dark:bg-green-800" />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Duration
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatDuration(duration)}
                          </span>
                        </div>
                      </>
                    )}

                    {isCreditPlan && credit && (
                      <>
                        <Separator className="bg-green-200 dark:bg-green-800" />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            Credits Included
                          </span>
                          <span className="font-bold text-xl text-green-600 dark:text-green-400 flex items-center gap-1">
                            {parseInt(credit).toLocaleString()} Credits
                            <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-8 pt-0">
            <Button
              asChild
              variant="outline"
              className="gap-2 w-full sm:w-auto border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/20"
            >
              <Link href="/dashboard" aria-label="Go to Home">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              className="gap-2 w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30"
            >
              <Link href="/download" aria-label="Get the App">
                <Laptop className="h-4 w-4" />
                Download App
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground hidden">
          <p>
            Need help? Contact our{" "}
            <Link
              href="/support"
              className="text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
