"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Loader2,
  Settings,
  Trash2,
} from "lucide-react";
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
import { formatRelativeTime } from "./notification-utils";

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
        className="w-[330px] sm:w-[370px] p-0 shadow-lg rounded-xl border-border/80 overflow-hidden"
      >
        {/* Compact Top Bar */}
        <div className="flex items-center justify-between gap-2 border-b px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              Notifications
            </span>
            <div className="inline-flex items-center rounded-md bg-muted p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={cn(
                  "rounded-sm px-2 py-0.5 font-medium transition-colors",
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
                  "rounded-sm px-2 py-0.5 font-medium transition-colors",
                  filterTab === "unread"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            </div>
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

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <p className="text-sm font-medium text-foreground">
              {filterTab === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filterTab === "unread"
                ? "You're all caught up."
                : "Updates will appear here automatically."}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[340px] overflow-y-auto">
            <div className="divide-y">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-start gap-2.5 px-3.5 py-3 transition-colors hover:bg-muted/40",
                    !item.isRead && "bg-primary/[0.03]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      !item.isRead ? "bg-primary" : "bg-muted-foreground/25"
                    )}
                    aria-hidden="true"
                  />

                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="min-w-0 flex-1 text-left focus:outline-hidden"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs leading-snug text-foreground truncate",
                          !item.isRead ? "font-semibold" : "font-medium"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {item.message}
                    </p>

                    {item.actionUrl && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-primary">
                        {item.actionLabel || "View"}
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="border-t p-1.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs font-medium text-muted-foreground hover:text-foreground justify-center"
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
