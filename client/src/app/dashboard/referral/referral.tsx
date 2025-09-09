"use client";

import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  DollarSign,
  Users,
  Wallet,
  TrendingUp,
  ExternalLink,
  Check,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { type ReferralData, requestWithdraw } from "@/services/referral";
import { useBaseUrl } from "@/hooks/use-baseUrl";

interface ReferralDashboardProps {
  referralData: ReferralData;
}

export function ReferralDashboard({ referralData }: ReferralDashboardProps) {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      term: earning.term,
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
      trx: withdrawal.trx,
      account: withdrawal.withdrawAccount,
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

  const handleWithdrawRequest = async () => {
    const amount = earnings.availableBalance;

    if (!mobileNumber.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }

    if (amount < 100) {
      toast.error("Minimum withdrawal amount is ৳100");
      return;
    }

    if (amount > earnings.availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestWithdraw({
        withdrawAccount: mobileNumber,
        amount: amount,
      });
      toast.success("Withdrawal request submitted successfully!");
      setIsWithdrawModalOpen(false);
      setMobileNumber("");
    } catch {
      toast.error("Failed to submit withdrawal request");
    } finally {
      setIsSubmitting(false);
    }
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
                  ৳{earnings.total.toFixed(2)}
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
                  ৳{earnings.thisMonth.toFixed(2)}
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
                  ৳{earnings.availableBalance.toFixed(2)}
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
                Minimum withdrawal: ৳100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Available Balance</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ৳{earnings.availableBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isWithdrawModalOpen}
                  onOpenChange={setIsWithdrawModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={earnings.availableBalance < 100}
                      className="w-full"
                      size="sm"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Request Withdrawal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Withdrawal Request
                      </DialogTitle>
                      <DialogDescription>
                        Submit your withdrawal request. Payment will be
                        processed within 1-3 business days.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Account Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="mobile"
                            placeholder="Enter your mobile number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Withdrawal Amount (BDT)</Label>
                        <Input
                          id="amount"
                          type="text"
                          value={`Withdrawal Amount: ${earnings.availableBalance}`}
                          disabled
                        />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          Available: ৳{earnings.availableBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsWithdrawModalOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleWithdrawRequest}
                        disabled={isSubmitting || !mobileNumber.trim()}
                        className="min-w-[100px]"
                      >
                        {isSubmitting ? "Processing..." : "Submit Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Earning History</CardTitle>
              <CardDescription>
                Track your referral earnings and commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referredUsers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {user.term}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.joinDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            ৳{user.earnings.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No earnings yet. Start referring users to earn commissions!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Withdrawal History</CardTitle>
              <CardDescription>
                Track your withdrawal requests and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">TRX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawHistory.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">
                            ৳{withdrawal.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                withdrawal.status === "Complete"
                                  ? "default"
                                  : withdrawal.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={`text-xs ${
                                withdrawal.status === "Complete"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : withdrawal.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  : "bg-red-100 text-red-800 hover:bg-red-100"
                              }`}
                            >
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(
                              withdrawal.requestDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {withdrawal.completedDate
                              ? new Date(
                                  withdrawal.completedDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {withdrawal.account ? withdrawal.account : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground text-right">
                            {withdrawal.trx ? withdrawal.trx : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No withdrawal requests yet. Request your first withdrawal
                    above!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
