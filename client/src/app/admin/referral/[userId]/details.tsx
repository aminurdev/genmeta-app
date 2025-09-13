"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  X,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Phone,
} from "lucide-react";
import {
  type ReferralDetails,
  type WithdrawHistory,
  updateWithdrawal,
} from "@/services/admin-dashboard/referral";

interface AdminUserReferralDashboardProps {
  data: ReferralDetails;
  userId: string;
}

export default function AdminUserReferralDashboard({
  data,
  userId,
}: AdminUserReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawHistory | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [trxId, setTrxId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      completed:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      rejected:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    setLoading(true);
    try {
      const status = actionType === "approve" ? "completed" : "rejected";
      const trxValue = actionType === "approve" ? trxId : rejectionReason;

      const result = await updateWithdrawal(
        userId,
        selectedWithdrawal._id,
        status,
        trxValue
      );

      if (result.success) {
        console.log("[v0] Withdrawal updated successfully:", result.data);
      } else {
        console.error("[v0] Failed to update withdrawal:", result.message);
      }

      // Close modal and reset state
      setSelectedWithdrawal(null);
      setActionType(null);
      setTrxId("");
      setRejectionReason("");
    } catch (error) {
      console.error("[v0] Error processing withdrawal:", error);
    } finally {
      setLoading(false);
    }
  };

  const openWithdrawalModal = (
    withdrawal: WithdrawHistory,
    action: "approve" | "reject"
  ) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {data.referrer.name}
            </h1>
            <p className="text-muted-foreground">{data.referrer.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                Referral Code:
              </span>
              <code className="bg-background px-2 py-1 rounded border text-sm font-mono">
                {data.referralCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(data.referralCode)}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-mono text-sm">{userId}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.availableBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalEarned)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.referralCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Withdraw Account
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.withdrawAccount || "Not Set"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="referrals">Referred Users</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              {data.withdrawHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No withdrawal history found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.withdrawHistory.map((withdrawal) => (
                      <TableRow key={withdrawal._id}>
                        <TableCell className="font-semibold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {withdrawal.withdrawAccount}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(withdrawal.status)}>
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {withdrawal.trx || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(withdrawal.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {withdrawal.issuedAt
                            ? formatDate(withdrawal.issuedAt)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  openWithdrawalModal(withdrawal, "approve")
                                }
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  openWithdrawalModal(withdrawal, "reject")
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earning History</CardTitle>
            </CardHeader>
            <CardContent>
              {data.earnedHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No earning history found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.earnedHistory.map((earning) => (
                      <TableRow key={earning._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{earning.user.name}</p>
                            <p className="text-sm text-gray-500">
                              {earning.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(earning.amount)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(earning.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referred Users</CardTitle>
            </CardHeader>
            <CardContent>
              {data.referredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No referred users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.referredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {user._id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Referrals:
                  </span>
                  <span className="font-semibold">{data.referralCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earned:</span>
                  <span className="font-semibold">
                    {formatCurrency(data.totalEarned)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Available Balance:
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(data.availableBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Withdraw Account:
                  </span>
                  <span className="font-mono">
                    {data.withdrawAccount || "Not Set"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.earnedHistory.slice(0, 5).map((earning) => (
                    <div
                      key={earning._id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {earning.user.name}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +{formatCurrency(earning.amount)}
                      </span>
                    </div>
                  ))}
                  {data.earnedHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Action Modal */}
      <Dialog
        open={!!selectedWithdrawal}
        onOpenChange={() => setSelectedWithdrawal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Withdrawal"
                : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Enter the transaction ID to complete this withdrawal."
                : "Provide a reason for rejecting this withdrawal request."}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p>
                  <strong>Amount:</strong>{" "}
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
                <p>
                  <strong>Account:</strong> {selectedWithdrawal.withdrawAccount}
                </p>
                <p>
                  <strong>Requested:</strong>{" "}
                  {formatDate(selectedWithdrawal.createdAt)}
                </p>
              </div>

              {actionType === "approve" ? (
                <div className="space-y-2">
                  <Label htmlFor="trxId">Transaction ID</Label>
                  <Input
                    id="trxId"
                    placeholder="Enter transaction ID"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedWithdrawal(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawalAction}
              disabled={
                loading ||
                (actionType === "approve" && !trxId) ||
                (actionType === "reject" && !rejectionReason)
              }
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  : ""
              }
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {loading
                ? "Processing..."
                : actionType === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
