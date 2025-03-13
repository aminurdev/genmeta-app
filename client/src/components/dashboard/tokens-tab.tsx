"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, PackageOpen, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiResponse } from "@/app/(main)/dashboard/page";
interface DataProps {
  userActivity: ApiResponse["data"]["userActivity"];
  packages: ApiResponse["data"]["packages"];
  handlePurchase: (packageId: string) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Format date for token history
const formatDate = (dateString: string): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export default function TokensTab({
  userActivity,
  packages,
  handlePurchase,
  isLoading = false,
  onRefresh,
}: DataProps) {
  // Safely calculate usage percentage
  const calculateUsagePercentage = () => {
    const used = userActivity?.totalTokensUsed || 0;
    const purchased = userActivity?.totalTokensPurchased || 1; // Prevent division by zero
    const percentage = (used * 100) / purchased;
    return Math.min(Math.round(percentage), 100); // Cap at 100% and round
  };

  // Get token history with fallback
  const tokenHistory = userActivity?.tokenHistory || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
          <CardDescription>
            Your current token balance and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Available Tokens</p>
              <p className="text-3xl font-bold">
                {userActivity?.availableTokens || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Used This Month</p>
              <p className="text-3xl font-bold">
                {userActivity?.tokensUsedThisMonth || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Purchased</p>
              <p className="text-3xl font-bold">
                {userActivity?.totalTokensPurchased || 0}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p>Total Usage</p>
              <p>
                {userActivity?.totalTokensUsed || 0} /{" "}
                {userActivity?.totalTokensPurchased || 0}
              </p>
            </div>
            <Progress value={calculateUsagePercentage()} />
            <p className="text-xs text-right text-muted-foreground">
              {calculateUsagePercentage()}% of tokens used
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Purchase Tokens</CardTitle>
            <CardDescription>Buy more tokens for your account</CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              title="Refresh token packages"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : !packages || packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                No Token Packages Available
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                We couldn&apos;t find any token packages at the moment. Please
                try again later or contact support.
              </p>
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh}>
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map(({ title, tokens, price, popular, _id }) => (
                <Card
                  key={_id}
                  className={`${
                    popular ? "border-primary" : ""
                  } relative overflow-hidden transition-all hover:shadow-md`}
                >
                  {popular && (
                    <div className="absolute -right-10 top-4 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
                      Popular
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-bold">
                      {tokens.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Tokens</p>
                    <p className="font-medium">৳ {price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ৳ {(price / tokens).toFixed(3)} per token
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={popular ? "default" : "outline"}
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => handlePurchase(_id)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Purchase"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token History</CardTitle>
          <CardDescription>
            Your token purchase and usage history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {tokenHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenHistory.map((transaction) => {
                    const isAddition =
                      transaction.actionType === "purchase" ||
                      transaction.actionType === "assigned" ||
                      transaction.actionType === "refund";

                    return (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          {formatDate(transaction.createdAt || "")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isAddition
                                ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                                : "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700"
                            }
                          >
                            {transaction.actionType?.charAt(0).toUpperCase() +
                              transaction.actionType?.slice(1) || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.description || "No description"}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            isAddition ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isAddition ? "+" : "-"}
                          {transaction.tokenDetails?.count || 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No token history available</p>
              </div>
            )}
          </div>
        </CardContent>
        {tokenHistory.length > 5 && (
          <CardFooter>
            <Button variant="outline" size="sm" className="ml-auto">
              View All Transactions
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
