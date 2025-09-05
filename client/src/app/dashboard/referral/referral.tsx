"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

export function ReferralDashboard() {
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    const storedCode = localStorage.getItem("referralCode");
    if (storedCode) {
      setReferralCode(storedCode);
    } else {
      const newCode =
        "REF" + Math.random().toString(36).substr(2, 6).toUpperCase();
      setReferralCode(newCode);
      localStorage.setItem("referralCode", newCode);
    }
  }, []);

  const earnings = {
    total: 2450.5,
    thisMonth: 680.25,
    availableBalance: 1850.75,
  };

  const withdrawHistory = [
    {
      id: 1,
      amount: 500.0,
      status: "Complete" as const,
      requestDate: "2024-01-15",
      completedDate: "2024-01-17",
    },
    {
      id: 2,
      amount: 99.75,
      status: "Complete" as const,
      requestDate: "2024-02-01",
      completedDate: "2024-02-03",
    },
    {
      id: 3,
      amount: 200.0,
      status: "Pending" as const,
      requestDate: "2024-02-15",
      completedDate: null,
    },
  ];

  const referredUsers = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      status: "Active",
      joinDate: "2024-01-15",
      earnings: 50.0,
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      status: "Active",
      joinDate: "2024-01-20",
      earnings: 50.0,
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol@example.com",
      status: "Pending",
      joinDate: "2024-01-25",
      earnings: 0.0,
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david@example.com",
      status: "Active",
      joinDate: "2024-02-01",
      earnings: 50.0,
    },
  ];

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

  const referralUrl = `https://app.example.com/signup?ref=${referralCode}`;

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
                <p className="text-xl font-bold mt-1">{referredUsers.length}</p>
              </div>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
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
                  onClick={() => copyToClipboard(referralUrl)}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Code:{" "}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded">
                    {referralCode}
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

          <Card>
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
        <div className="lg:col-span-2 space-y-6">
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
