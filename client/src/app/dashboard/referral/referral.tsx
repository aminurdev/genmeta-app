"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  DollarSign,
  Users,
  Wallet,
  TrendingUp,
  ExternalLink,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { ReferralData } from "@/services/referral";
import { useBaseUrl } from "@/hooks/use-baseUrl";

interface ReferralDashboardProps {
  referralData: ReferralData;
}

export function ReferralDashboard({ referralData }: ReferralDashboardProps) {
  // Helper function to calculate this month's earnings
  const calculateThisMonthEarnings = (): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (referralData.earnedHistory || []).reduce((sum, earning) => {
      const earningDate = new Date(earning.createdAt);
      if (
        earningDate.getMonth() === currentMonth &&
        earningDate.getFullYear() === currentYear
      ) {
        return sum + earning.amount;
      }
      return sum;
    }, 0);
  };

  // Transform earnedHistory to referredUsers format
  const referredUsers = (referralData.earnedHistory || []).map(
    (earning, index) => ({
      id: index + 1,
      name: earning.user.name,
      email: earning.user.email,
      status: "Active", // All users in earnedHistory are active
      joinDate: new Date(earning.createdAt).toISOString().split("T")[0],
      earnings: earning.amount,
    })
  );

  // Transform withdrawHistory to match UI format
  const withdrawHistory = (referralData.withdrawHistory || []).map(
    (withdrawal, index) => ({
      id: index + 1,
      amount: withdrawal.amount,
      status:
        withdrawal.status === "completed"
          ? ("Complete" as const)
          : withdrawal.status === "pending"
          ? ("Pending" as const)
          : ("Rejected" as const),
      requestDate: new Date(withdrawal.createdAt).toISOString().split("T")[0],
      completedDate: withdrawal.issuedAt
        ? new Date(withdrawal.issuedAt).toISOString().split("T")[0]
        : null,
    })
  );

  const earnings = {
    total: referralData.totalEarned,
    thisMonth: calculateThisMonthEarnings(),
    availableBalance: referralData.availableBalance,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard!");
  };

  const handleWithdrawRequest = () => {
    if (earnings.availableBalance < 50) {
      toast("Minimum withdrawal amount is $50");
      return;
    }
    toast("Withdrawal request submitted successfully!");
  };

  const baseUrl = useBaseUrl();
  const referralUrl = `${baseUrl}/signup?ref=${referralData.referralCode}`;

  const [copied, setCopied] = React.useState(false);

  return (
    <div className="p-4 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-semibold text-balance">
          Referral Program
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn commissions by referring new users to our platform
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Earned
                </p>
                <p className="text-xl font-bold mt-1">
                  ${earnings.total.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This Month
                </p>
                <p className="text-xl font-bold mt-1">
                  ${earnings.thisMonth.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Available
                </p>
                <p className="text-xl font-bold mt-1 text-emerald-600">
                  ${earnings.availableBalance.toFixed(2)}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Referrals
                </p>
                <p className="text-xl font-bold mt-1">
                  {referralData.referralCount}
                </p>
              </div>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        {/* Left Column - Actions */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Share & Earn</CardTitle>
              <CardDescription className="text-sm">
                Your unique referral link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    copyToClipboard(referralUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Code:{" "}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded">
                    {referralData.referralCode}
                  </code>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Withdraw Funds</CardTitle>
              <CardDescription className="text-sm">
                Minimum withdrawal: $50
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Available Balance</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ${earnings.availableBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleWithdrawRequest}
                  disabled={earnings.availableBalance < 50}
                  className="w-full"
                  size="sm"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Request Withdrawal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Data Tables */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Referrals</CardTitle>
              <CardDescription className="text-sm">
                {referredUsers.filter((u) => u.status === "Active").length}{" "}
                active •{" "}
                {referredUsers.filter((u) => u.status === "Pending").length}{" "}
                pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {referredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                      <Badge
                        variant={
                          user.status === "Active" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {user.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${user.earnings.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.joinDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawHistory.slice(0, 3).map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        ${withdrawal.amount.toFixed(2)}
                      </div>
                      <Badge
                        variant={
                          withdrawal.status === "Complete"
                            ? "default"
                            : "secondary"
                        }
                        className={`text-xs ${
                          withdrawal.status === "Complete"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {withdrawal.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {withdrawal.requestDate}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
