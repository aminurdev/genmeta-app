"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Settings,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "@/services/queries/notifications";
import type { NotificationItem } from "@/types/notification";
import {
  CATEGORY_META,
  PRIORITY_META,
  formatRelativeTime,
} from "./notification-utils";

interface NotificationBellProps {
  scope: "user" | "admin";
  className?: string;
}

export function NotificationBell({ scope, className }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");

  const centerPath =
    scope === "admin" ? "/admin/notifications" : "/dashboard/notifications";

  const { isConnected } = useNotificationStream({
    scope,
    enabled: true,
    enableToast: true,
  });

  const { data: unreadResponse } = useUnreadNotificationCountQuery(scope, {
    sseConnected: isConnected,
  });

  const {
    data: listResponse,
    isLoading,
    refetch,
  } = useNotificationsQuery(
    {
      scope,
      status: filterTab === "unread" ? "unread" : "all",
      page: 1,
      limit: 10,
    },
    { enabled: open }
  );

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const unreadCount =
    unreadResponse?.success && unreadResponse.data
      ? unreadResponse.data.unreadCount
      : listResponse?.success && listResponse.data
        ? listResponse.data.unreadCount
        : 0;

  const notifications: NotificationItem[] =
    listResponse?.success && listResponse.data
      ? listResponse.data.notifications
      : [];

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      refetch();
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.actionUrl) {
      setOpen(false);
      router.push(item.actionUrl);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-hidden",
            className
          )}
          aria-label={`View notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[390px] p-0 shadow-xl rounded-xl border-border/80 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 px-1.5 text-[11px] font-medium"
              >
                {unreadCount} unread
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => markAllReadMutation.mutate({ scope })}
                disabled={markAllReadMutation.isPending}
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Notification preferences"
            >
              <Link
                href={`${centerPath}?tab=preferences`}
                onClick={() => setOpen(false)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center border-b border-border/60 px-3 py-2 bg-background">
          <div className="inline-flex items-center rounded-lg bg-muted p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                filterTab === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unread")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                filterTab === "unread"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Body */}
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
              {filterTab === "unread"
                ? "You have no unread notifications right now."
                : "New notifications will appear here automatically."}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px] overflow-y-auto">
            <div className="divide-y divide-border/60">
              {notifications.map((item) => {
                const catMeta =
                  CATEGORY_META[item.category] || CATEGORY_META.announcement;
                const CatIcon = catMeta.icon;
                const showPriority =
                  item.priority === "urgent" || item.priority === "high";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex items-start gap-3 p-3.5 transition-colors hover:bg-accent/50",
                      !item.isRead && "bg-primary/[0.03]"
                    )}
                  >
                    {!item.isRead && (
                      <span
                        className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}

                    <div className="shrink-0 mt-0.5 pl-1">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border border-border/60",
                          catMeta.iconBgClass
                        )}
                      >
                        <CatIcon
                          className={cn("h-4 w-4", catMeta.iconTextClass)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="min-w-0 flex-1 text-left focus:outline-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs leading-snug text-foreground line-clamp-1",
                            !item.isRead ? "font-semibold" : "font-medium"
                          )}
                        >
                          {item.title}
                        </p>
                        {showPriority && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                              PRIORITY_META[item.priority].className
                            )}
                          >
                            {PRIORITY_META[item.priority].label}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {item.actionUrl && (
                          <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                            {item.actionLabel || "View"}
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(item.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Delete notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
            <Link href={centerPath} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
