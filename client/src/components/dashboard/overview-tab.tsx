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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { ApiResponse } from "@/app/(main)/dashboard/page";
import { formatTimeAgo } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface DataProps {
  data: ApiResponse["data"];

  handlePurchase: (packageId: string) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => void;
  setActiveTab: (tab: string) => void;
}

export default function OverviewTab({
  data,
  handlePurchase,
  isLoading = false,
  setActiveTab,
}: DataProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");
  const [isViewAll, setIsViewAll] = useState(false);

  // Calculate usage percentage safely
  const calculateUsagePercentage = () => {
    const used = data.userActivity?.totalTokensUsed || 0;
    const purchased = data.userActivity?.totalTokensPurchased || 1; // Prevent division by zero
    const percentage = (used * 100) / purchased;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Handle purchase button click
  const handlePurchaseClick = () => {
    if (!selectedPackageId) {
      // If no package is selected, use the first package in the list
      const firstPackage = data.packages[0];
      if (firstPackage) {
        handlePurchase(firstPackage._id);
      }
    } else {
      handlePurchase(selectedPackageId);
    }
  };
  const tokenHistory = data.userActivity?.tokenHistory || [];

  useEffect(() => {
    if (data.packages && data.packages.length > 0 && !selectedPackageId) {
      // Find the popular package
      const popularPackage = data.packages.find((pkg) => pkg.popular);

      // Set it as selected, or fall back to the first package if none is marked as popular
      if (popularPackage) {
        setSelectedPackageId(popularPackage._id);
      } else {
        setSelectedPackageId(data.packages[0]._id);
      }
    }
  }, [data.packages, selectedPackageId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.userActivity?.availableTokens || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.userActivity?.tokensUsedThisMonth
                ? `+ ${data.userActivity.tokensUsedThisMonth} used this month`
                : "No tokens used this month"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Images Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.userActivity?.totalImageProcessed || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateUsagePercentage().toFixed(1)}%
            </div>
            <Progress value={calculateUsagePercentage()} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.userActivity?.plan?.planId?.title || "No Plan"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent image processing jobs
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Tokens</TableHead>
                    <TableHead className="text-center">Images</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActivity.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-mono text-xs">
                        {item.batchId
                          ? item.batchId.substring(
                              Math.max(0, item.batchId.length - 12),
                              item.batchId.length
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatTimeAgo(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.imagesCount ?? "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.imagesCount ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No recent activity found
              </div>
            )}
          </CardContent>
          <CardFooter>
            {data.recentActivity.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setActiveTab("history")}
              >
                View All
              </Button>
            )}
          </CardFooter>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Purchase</CardTitle>
            <CardDescription>Buy more tokens for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="token-package"
                className="text-sm font-medium text-muted-foreground"
              >
                Select Token Package
              </Label>
              {data.packages.length > 0 ? (
                <Select
                  value={selectedPackageId}
                  onValueChange={setSelectedPackageId}
                  defaultValue={
                    data.packages.find((pkg) => pkg.popular)?._id ||
                    data.packages[0]?._id
                  }
                >
                  <SelectTrigger
                    id="token-package"
                    className="w-full bg-background border-input hover:bg-accent/10 transition-colors h-16"
                  >
                    <SelectValue placeholder="Choose your token package" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {data.packages.map((pkg) => (
                      <SelectItem
                        key={pkg._id}
                        value={pkg._id}
                        className="flex items-center py-3 px-3 cursor-pointer hover:bg-accent/20 transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pkg.title}</span>
                            {pkg.popular && (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary text-xs font-semibold"
                              >
                                Popular
                              </Badge>
                            )}
                            {pkg.discount > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 text-xs font-semibold"
                              >
                                {pkg.discount}% OFF
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">
                              {pkg.tokens.toLocaleString()} Tokens
                            </span>
                            <span className="text-sm text-muted-foreground">
                              •
                            </span>
                            {pkg.discount > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">
                                  ৳{" "}
                                  {(
                                    pkg.price *
                                    (1 - pkg.discount / 100)
                                  ).toFixed(0)}
                                </span>
                                <span className="text-xs line-through text-muted-foreground">
                                  ৳ {pkg.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm">৳ {pkg.price}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-16 w-full rounded-md border border-input bg-background/50 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading packages...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="payment-method"
                className="text-sm font-medium text-muted-foreground"
              >
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                disabled={data.packages.length === 0}
                defaultValue="bkash"
              >
                <SelectTrigger
                  id="payment-method"
                  className="w-full h-10 bg-background border-input hover:bg-accent/10 transition-colors"
                >
                  <SelectValue placeholder="Select payment option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="bkash"
                    className="py-3 cursor-pointer hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-pink-500/10 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-pink-500" />
                      </div>
                      <span>bKash</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handlePurchaseClick}
              disabled={isLoading || data.packages.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Purchase Tokens"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div>
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
                    {tokenHistory
                      .slice(0, !isViewAll ? 5 : tokenHistory.length)
                      .map((transaction) => {
                        const isAddition =
                          transaction.actionType === "purchase" ||
                          transaction.actionType === "assigned" ||
                          transaction.actionType === "refund";

                        return (
                          <TableRow key={transaction._id}>
                            <TableCell>
                              {formatTimeAgo(transaction.createdAt || "")}
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
                                {transaction.actionType
                                  ?.charAt(0)
                                  .toUpperCase() +
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
              <Button
                onClick={() => setIsViewAll((prev) => !prev)}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                {isViewAll ? "View less" : "View All"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
