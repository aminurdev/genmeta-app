"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  getActiveSessions,
  logoutAllSessions,
  revokeSession,
  type SessionInfo,
} from "@/services/auth-services";
import { useAuth } from "@/components/providers/auth-provider";

function isMobileDevice(deviceName: string, userAgent: string): boolean {
  return /iOS|Android|iPhone|iPad|Mobile/i.test(`${deviceName} ${userAgent}`);
}

export function ActiveSessions() {
  const { setUser } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getActiveSessions();
      if (res.success && res.data?.sessions) {
        setSessions(res.data.sessions);
      }
    } catch {
      toast.error("Failed to fetch active sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string, isCurrent: boolean) => {
    setRevokingId(sessionId);
    try {
      const res = await revokeSession(sessionId);
      if (res.success) {
        if (isCurrent) {
          toast.success("Current session revoked. Signing out...");
          setUser(null);
          window.location.href = "/login";
          return;
        }
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Device session revoked.");
      } else {
        toast.error(res.message || "Could not revoke session.");
      }
    } catch {
      toast.error("Could not revoke session.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setIsRevokingAll(true);
    try {
      const res = await logoutAllSessions();
      if (res.success) {
        toast.success("Signed out from all devices.");
        setUser(null);
        window.location.href = "/login";
      } else {
        toast.error(res.message || "Failed to sign out from all devices.");
      }
    } catch {
      toast.error("Failed to sign out from all devices.");
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Devices currently signed in to your web account
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={isLoading || isRevokingAll}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleLogoutAll}
            disabled={isLoading || isRevokingAll || sessions.length === 0}
          >
            {isRevokingAll ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
            )}
            Sign out all devices
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active sessions found.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {sessions.map((session) => {
              const mobile = isMobileDevice(
                session.deviceName,
                session.userAgent
              );
              const DeviceIcon = mobile ? Smartphone : Monitor;
              const lastActiveLabel = session.lastActiveAt
                ? formatDistanceToNow(new Date(session.lastActiveAt), {
                    addSuffix: true,
                  })
                : "Recently";

              return (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                      <DeviceIcon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {session.deviceName || "Unknown Device"}
                        </span>
                        {session.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-medium"
                          >
                            Current device
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ipAddress || "Unknown"} · Active{" "}
                        {lastActiveLabel}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingId === session.id || isRevokingAll}
                    onClick={() => handleRevoke(session.id, session.isCurrent)}
                    className="self-start sm:self-auto text-destructive hover:text-destructive"
                  >
                    {revokingId === session.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
  );
}
