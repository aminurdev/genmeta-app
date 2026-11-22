"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  Trash2,
  LogOut,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  useActiveSessionsQuery,
  useLogoutAllSessionsMutation,
  useRevokeSessionMutation,
} from "@/services/queries/dashboard";
import { useAuth } from "@/components/providers/auth-provider";

function isMobileDevice(deviceName: string, userAgent: string): boolean {
  return /iOS|Android|iPhone|iPad|Mobile/i.test(`${deviceName} ${userAgent}`);
}

function formatLastActive(value?: string | null): string {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function ActiveSessions() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  const {
    data: sessionsRes,
    isLoading,
    isRefetching,
    refetch,
  } = useActiveSessionsQuery();

  const revokeMutation = useRevokeSessionMutation();
  const logoutAllMutation = useLogoutAllSessionsMutation();

  const sessions = sessionsRes?.success ? (sessionsRes.data?.sessions ?? []) : [];

  const handleRefresh = async () => {
    const res = await refetch();
    if (res.isError || !res.data?.success) {
      toast.error(
        (res.data && !res.data.success ? res.data.message : null) ||
          "Failed to load active sessions"
      );
      return;
    }
    toast.success("Active sessions refreshed");
  };

  const handleRevoke = async (sessionId: string, isCurrent: boolean) => {
    try {
      const res = await revokeMutation.mutateAsync(sessionId);
      if (res.success) {
        if (isCurrent) {
          toast.success("Current session revoked. Signing out...");
          setUser(null);
          router.replace("/login");
          return;
        }
        toast.success("Device session revoked.");
      } else {
        toast.error(res.message || "Could not revoke session.");
      }
    } catch {
      toast.error("Could not revoke session.");
    }
  };

  const handleLogoutAll = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (logoutAllMutation.isPending) return;

    try {
      const res = await logoutAllMutation.mutateAsync();
      if (res.success) {
        toast.success("Signed out from all devices.");
        setConfirmLogoutAll(false);
        setUser(null);
        router.replace("/login");
      } else {
        toast.error(res.message || "Failed to sign out from all devices.");
        setConfirmLogoutAll(false);
      }
    } catch {
      toast.error("Failed to sign out from all devices.");
      setConfirmLogoutAll(false);
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Active Web Sessions
              {!isLoading && (
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {sessions.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Browsers and devices currently signed in to your web account.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={
                isLoading || isRefetching || logoutAllMutation.isPending
              }
              className="gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading || isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmLogoutAll(true)}
              disabled={
                isLoading ||
                logoutAllMutation.isPending ||
                sessions.length === 0
              }
              className="gap-1.5"
            >
              {logoutAllMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Sign out all
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading active sessions...
            </div>
          ) : !sessionsRes?.success ? (
            <div className="rounded-lg border border-dashed py-8 px-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {sessionsRes?.message || "Failed to load active sessions."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 rounded-lg border border-dashed">
              No active web sessions found.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {sessions.map((session) => {
                const mobile = isMobileDevice(
                  session.deviceName,
                  session.userAgent
                );
                const DeviceIcon = mobile ? Smartphone : Monitor;
                const isRevokingThis =
                  revokeMutation.isPending &&
                  revokeMutation.variables === session.id;

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <DeviceIcon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {session.deviceName || "Unknown Device"}
                          </span>
                          {session.isCurrent && (
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-medium"
                            >
                              Current session
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground break-words">
                          IP: {session.ipAddress || "Unknown"} · Active{" "}
                          {formatLastActive(session.lastActiveAt)}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        revokeMutation.isPending || logoutAllMutation.isPending
                      }
                      onClick={() =>
                        handleRevoke(session.id, session.isCurrent)
                      }
                      className="self-start sm:self-auto shrink-0 gap-1.5 text-destructive hover:text-destructive"
                    >
                      {isRevokingThis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {session.isCurrent ? "Sign out" : "Revoke"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmLogoutAll}
        onOpenChange={(open) => {
          if (!open && !logoutAllMutation.isPending) {
            setConfirmLogoutAll(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out from all web devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke every active web session including your current
              browser. You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logoutAllMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              disabled={logoutAllMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {logoutAllMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                "Sign out all devices"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
