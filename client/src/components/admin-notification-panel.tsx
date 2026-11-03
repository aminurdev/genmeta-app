"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWithdrawalNotificationsQuery } from "@/services/queries/admin-dashboard";
import type { WithdrawalNotification } from "@/types/admin";
import { cn } from "@/lib/utils";

export function AdminNotificationPanel() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isRefetching, refetch } =
    useWithdrawalNotificationsQuery();

  const responseData = data && data.success ? data.data : undefined;
  const notifications: WithdrawalNotification[] =
    responseData?.notifications || [];
  const pendingCount = responseData?.count ?? notifications.length;

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-xl rounded-xl border-border/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              Notifications
            </span>
            {pendingCount > 0 ? (
              <Badge
                variant="destructive"
                className="h-5 px-1.5 text-[11px] font-medium"
              >
                {pendingCount} Pending User{pendingCount > 1 ? "s" : ""}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[11px] font-medium text-muted-foreground"
              >
                0 Pending
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh notifications"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")}
            />
          </Button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="font-medium text-sm text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px]">
              No pending referral users waiting for withdrawal payment.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px] overflow-y-auto">
            <div className="divide-y divide-border/60">
              {notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-3.5 transition-colors hover:bg-accent/50 group"
                >
                  <Avatar className="h-9 w-9 border border-border shrink-0 mt-0.5">
                    <AvatarImage
                      src={item.userAvatar || undefined}
                      alt={item.userName}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(item.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {item.userName}
                      </p>
                      <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                        ৳{item.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.userEmail || "Referral User"}
                      </span>
                      {item.pendingCount && item.pendingCount > 1 ? (
                        <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {item.pendingCount} requests
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        <Wallet className="h-2.5 w-2.5" />
                        {item.withdrawAccount}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTimeAgo(item.requestedAt)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 shrink-0 self-center" />
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="border-t border-border/70 p-2 bg-muted/20">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-foreground justify-center"
          >
            <Link href="/admin/referral" onClick={() => setOpen(false)}>
              View All Referral History
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
