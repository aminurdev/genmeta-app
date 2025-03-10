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
import { getAccessToken, getBaseApi } from "@/services/image-services";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { Loader2, PackageOpen, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenPackage {
  _id: string;
  title: string;
  tokens: number;
  price: number;
  popular?: boolean;
}

interface TokenBalance {
  available: number;
  used: number;
  total: number;
}

export default function TokensTab() {
  const [isPending, setIsPending] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    available: 2500,
    used: 1750,
    total: 5000,
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchTokenPackages = useCallback(async () => {
    try {
      setIsPending(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPi}/pricing-plan/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch token packages");
      }

      const data = await response.json();
      setTokenPackages(data.data || []);
    } catch (error) {
      console.error("Error fetching token packages:", error);
      toast.error("Failed to fetch token packages. Please try again.");
    } finally {
      setIsPending(false);
    }
  }, []);

  // Fetch token packages on component mount
  useEffect(() => {
    fetchTokenPackages();
  }, [fetchTokenPackages]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTokenPackages();
    setIsRefreshing(false);
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setIsLoading(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseAPi}/payment/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          packageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bKash payment");
      }

      const data = await response.json();

      if (data.success && data.data.bkashURL) {
        window.location.href = data.data.bkashURL; // Redirect to bKash URL
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Error creating bKash payment:", error);
      toast.error("Payment initiation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const usagePercentage = Math.round(
    (tokenBalance.used / tokenBalance.total) * 100
  );

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
                {tokenBalance.available.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Used This Month</p>
              <p className="text-3xl font-bold">
                {tokenBalance.used.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Purchased</p>
              <p className="text-3xl font-bold">
                {tokenBalance.total.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p>Monthly Usage</p>
              <p>
                {tokenBalance.used.toLocaleString()} /{" "}
                {tokenBalance.total.toLocaleString()}
              </p>
            </div>
            <Progress value={usagePercentage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Purchase Tokens</CardTitle>
            <CardDescription>Buy more tokens for your account</CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh token packages"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
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
          ) : tokenPackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                No Token Packages Available
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                We couldn&apos;t find any token packages at the moment. Please
                try again later or contact support.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tokenPackages.map(({ title, tokens, price, popular, _id }) => (
                <Card
                  key={title}
                  className={`${popular ? "border-primary" : ""} relative`}
                >
                  <CardHeader className="pb-2">
                    {popular && (
                      <Badge className="absolute right-2 top-2">Popular</Badge>
                    )}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Mar 8, 2025</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                    >
                      Purchase
                    </Badge>
                  </TableCell>
                  <TableCell>Token Package: Pro</TableCell>
                  <TableCell className="text-right text-green-600">
                    +1000
                  </TableCell>
                  <TableCell className="text-right">2500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mar 7, 2025</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700"
                    >
                      Usage
                    </Badge>
                  </TableCell>
                  <TableCell>Batch Processing: 10 images</TableCell>
                  <TableCell className="text-right text-red-600">
                    -250
                  </TableCell>
                  <TableCell className="text-right">1500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mar 5, 2025</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700"
                    >
                      Usage
                    </Badge>
                  </TableCell>
                  <TableCell>Image Enhancement: product-photo.jpg</TableCell>
                  <TableCell className="text-right text-red-600">-75</TableCell>
                  <TableCell className="text-right">1750</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mar 1, 2025</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                    >
                      Purchase
                    </Badge>
                  </TableCell>
                  <TableCell>Token Package: Basic</TableCell>
                  <TableCell className="text-right text-green-600">
                    +500
                  </TableCell>
                  <TableCell className="text-right">1825</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="ml-auto">
            View All Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
