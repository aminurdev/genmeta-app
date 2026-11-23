"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Megaphone,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import {
  useAdminBroadcastsQuery,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useMarkNotificationUnreadMutation,
  useNotificationPreferencesQuery,
  useNotificationsQuery,
  useSendAdminBroadcastMutation,
  useUpdateNotificationPreferencesMutation,
} from "@/services/queries/notifications";
import type {
  BroadcastPayload,
  BroadcastTarget,
  NotificationItem,
  NotificationPriority,
  NotificationUserRole,
} from "@/types/notification";
import {
  BROADCAST_TARGET_LABELS,
  PRIORITY_META,
  formatRelativeTime,
  getCategoryDisplayMeta,
  getRoleCategories,
  groupNotificationsByDate,
} from "./notification-utils";

interface NotificationCenterProps {
  scope: "user" | "admin";
  userRole: NotificationUserRole;
}

type CenterTab = "inbox" | "preferences" | "broadcasts";

export function NotificationCenter({
  scope,
  userRole,
}: NotificationCenterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAdminConsole =
    scope === "admin" &&
    (userRole === "admin" || userRole === "superAdmin");
  const isSuperAdmin = userRole === "superAdmin";
  const roleCategories = getRoleCategories(userRole, scope);

  const urlTabParam = searchParams.get("tab");
  const initialTab: CenterTab =
    urlTabParam === "preferences"
      ? "preferences"
      : urlTabParam === "broadcasts" && isAdminConsole
        ? "broadcasts"
        : "inbox";

  const [activeTab, setActiveTab] = useState<CenterTab>(initialTab);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);

  const handleTabChange = (next: string) => {
    const validTab: CenterTab =
      next === "preferences"
        ? "preferences"
        : next === "broadcasts" && isAdminConsole
          ? "broadcasts"
          : "inbox";
    setActiveTab(validTab);
    const params = new URLSearchParams(searchParams.toString());
    if (validTab === "inbox") {
      params.delete("tab");
    } else {
      params.set("tab", validTab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useNotificationStream({
    scope,
    enabled: true,
    enableToast: false,
  });

  const { data: listResponse, isLoading } = useNotificationsQuery({
    scope,
    status: statusFilter,
    page,
    limit: 15,
  });

  const notifications =
    listResponse?.success && listResponse.data
      ? listResponse.data.notifications
      : [];
  const pagination =
    listResponse?.success && listResponse.data
      ? listResponse.data.pagination
      : null;
  const unreadCount =
    listResponse?.success && listResponse.data
      ? listResponse.data.unreadCount
      : 0;

  const groupedNotifications = groupNotificationsByDate(notifications);

  const markReadMutation = useMarkNotificationReadMutation();
  const markUnreadMutation = useMarkNotificationUnreadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const { data: prefsResponse, isLoading: prefsLoading } =
    useNotificationPreferencesQuery(scope);
  const updatePrefsMutation = useUpdateNotificationPreferencesMutation(scope);
  const prefs =
    prefsResponse?.success && prefsResponse.data
      ? prefsResponse.data.preferences
      : null;

  // Broadcast compose state (admin/superAdmin only)
  const [broadcastPage, setBroadcastPage] = useState(1);
  const [broadcastTarget, setBroadcastTarget] =
    useState<BroadcastTarget>("all_users");
  const [targetIdentifiersText, setTargetIdentifiersText] = useState("");
  const [broadcastCategory, setBroadcastCategory] = useState<
    BroadcastPayload["category"]
  >("announcement");
  const [broadcastPriority, setBroadcastPriority] =
    useState<NotificationPriority>("normal");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActionLabel, setBroadcastActionLabel] = useState("");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState("");
  const [broadcastSendEmail, setBroadcastSendEmail] = useState(false);

  const { data: broadcastsResponse, isLoading: broadcastsLoading } =
    useAdminBroadcastsQuery(broadcastPage, 10, {
      enabled: isAdminConsole && activeTab === "broadcasts",
    });
  const sendBroadcastMutation = useSendAdminBroadcastMutation();

  const handleMarkAllRead = async () => {
    const res = await markAllReadMutation.mutateAsync({ scope });
    if (res.success) {
      toast.success("All notifications marked as read");
    } else {
      toast.error(res.message || "Failed to update notifications");
    }
  };

  const handleCategoryEmailToggle = async (
    category: (typeof roleCategories)[number],
    checked: boolean
  ) => {
    const res = await updatePrefsMutation.mutateAsync({
      categories: { [category]: { email: checked } },
    });
    if (res.success) {
      toast.success("Email preference saved");
    } else {
      toast.error(res.message || "Failed to update preference");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    const identifiers = targetIdentifiersText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (broadcastTarget === "specific_users" && identifiers.length === 0) {
      toast.error("Enter at least one user email or user ID");
      return;
    }

    const payload: BroadcastPayload = {
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      category: broadcastCategory,
      priority: broadcastPriority,
      target: broadcastTarget,
      targetIdentifiers:
        broadcastTarget === "specific_users" ? identifiers : undefined,
      actionLabel: broadcastActionLabel.trim() || null,
      actionUrl: broadcastActionUrl.trim() || null,
      sendEmail: broadcastSendEmail,
    };

    const res = await sendBroadcastMutation.mutateAsync(payload);
    if (res.success && res.data?.broadcast) {
      const stats = res.data.broadcast.stats;
      toast.success(
        `Sent to ${stats.deliveredCount} of ${stats.targetedCount} recipients`
      );
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastActionLabel("");
      setBroadcastActionUrl("");
      setTargetIdentifiersText("");
      setBroadcastSendEmail(false);
    } else {
      toast.error(
        !res.success ? res.message : "Failed to send broadcast notification"
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="font-semibold">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {isSuperAdmin && scope === "admin"
            ? "Monitor payments, withdrawals, security alerts, and system maintenance."
            : isAdminConsole
              ? "Monitor customer payments, withdrawal requests, and security alerts."
              : "Stay updated on billing receipts, plan credits, referrals, and account security."}
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          {isAdminConsole && (
            <TabsTrigger value="broadcasts" className="gap-2">
              <Megaphone className="h-4 w-4" />
              <span>Broadcasts</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* INBOX TAB */}
        <TabsContent value="inbox" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-lg bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  statusFilter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("unread");
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  statusFilter === "unread"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread
              </button>
            </div>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="h-8 gap-1.5 text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 flex items-start gap-3.5">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3.5 w-full max-w-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base text-foreground">
                  {statusFilter === "unread"
                    ? "No unread notifications"
                    : "You're all caught up"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {statusFilter === "unread"
                    ? "Switch to All to review your recent notification history."
                    : "Important alerts and updates will appear here automatically."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {groupedNotifications.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    {group.label}
                  </h2>
                  <div className="space-y-2">
                    {group.items.map((item: NotificationItem) => {
                      const catMeta = getCategoryDisplayMeta(
                        item.category,
                        scope
                      );
                      const CatIcon = catMeta.icon;
                      const showPriority =
                        item.priority === "urgent" || item.priority === "high";

                      return (
                        <Card
                          key={item.id}
                          className={cn(
                            "transition-colors relative overflow-hidden",
                            !item.isRead &&
                              "border-primary/40 bg-primary/[0.02]"
                          )}
                        >
                          {!item.isRead && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                              aria-hidden="true"
                            />
                          )}
                          <CardContent className="p-4 flex items-start gap-3.5">
                            <div className="shrink-0 mt-0.5">
                              <div
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-full border border-border/60",
                                  catMeta.iconBgClass
                                )}
                              >
                                <CatIcon
                                  className={cn(
                                    "h-4 w-4",
                                    catMeta.iconTextClass
                                  )}
                                />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className={cn(
                                    "text-sm text-foreground",
                                    !item.isRead
                                      ? "font-semibold"
                                      : "font-medium"
                                  )}
                                >
                                  {item.title}
                                </h3>
                                {showPriority && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] font-semibold uppercase",
                                      PRIORITY_META[item.priority].className
                                    )}
                                  >
                                    {PRIORITY_META[item.priority].label}
                                  </Badge>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                                {item.message}
                              </p>

                              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(item.createdAt)}
                                </span>

                                {item.actionUrl && (
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1.5 text-xs"
                                    onClick={() => {
                                      if (!item.isRead) {
                                        markReadMutation.mutate(item.id);
                                      }
                                    }}
                                  >
                                    <Link href={item.actionUrl}>
                                      <span>
                                        {item.actionLabel || "View Details"}
                                      </span>
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title={
                                  item.isRead
                                    ? "Mark as unread"
                                    : "Mark as read"
                                }
                                onClick={() =>
                                  item.isRead
                                    ? markUnreadMutation.mutate(item.id)
                                    : markReadMutation.mutate(item.id)
                                }
                              >
                                {item.isRead ? (
                                  <MailOpen className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="Delete notification"
                                onClick={() => deleteMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 gap-1 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                      className="h-8 gap-1 text-xs"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="mt-4">
          {prefsLoading || !prefs ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  In-app notifications are always enabled. Choose which email
                  alerts you want to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/70">
                {roleCategories.map((cat) => {
                  const meta = getCategoryDisplayMeta(cat, scope);
                  const Icon = meta.icon;
                  const emailEnabled = prefs.categories?.[cat]?.email ?? true;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            meta.iconBgClass
                          )}
                        >
                          <Icon
                            className={cn("h-4 w-4", meta.iconTextClass)}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {meta.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {meta.description}
                          </p>
                          {cat === "security" && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                              Always on for critical alerts
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        aria-label={`${meta.label} email notifications`}
                        checked={emailEnabled}
                        disabled={updatePrefsMutation.isPending}
                        onCheckedChange={(checked) =>
                          handleCategoryEmailToggle(cat, checked)
                        }
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ADMIN BROADCASTS TAB */}
        {isAdminConsole && (
          <TabsContent value="broadcasts" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Send Broadcast
                </CardTitle>
                <CardDescription>
                  Send an announcement to a targeted user segment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-target">Audience</Label>
                      <Select
                        value={broadcastTarget}
                        onValueChange={(v) =>
                          setBroadcastTarget(v as BroadcastTarget)
                        }
                      >
                        <SelectTrigger id="broadcast-target" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(BROADCAST_TARGET_LABELS) as Array<
                              [BroadcastTarget, string]
                            >
                          ).map(([val, label]) => (
                            <SelectItem key={val} value={val}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-category">Category</Label>
                      <Select
                        value={broadcastCategory}
                        onValueChange={(v) =>
                          setBroadcastCategory(v as BroadcastPayload["category"])
                        }
                      >
                        <SelectTrigger
                          id="broadcast-category"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">
                            Announcement
                          </SelectItem>
                          <SelectItem value="plan">Plan & Credits</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          {isSuperAdmin && (
                            <SelectItem value="system">System</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-priority">Priority</Label>
                      <Select
                        value={broadcastPriority}
                        onValueChange={(v) =>
                          setBroadcastPriority(v as NotificationPriority)
                        }
                      >
                        <SelectTrigger
                          id="broadcast-priority"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Important</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {broadcastTarget === "specific_users" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-identifiers">
                        Recipient Emails or User IDs
                      </Label>
                      <Textarea
                        id="broadcast-identifiers"
                        rows={2}
                        placeholder="user1@example.com, user2@example.com"
                        value={targetIdentifiersText}
                        onChange={(e) =>
                          setTargetIdentifiersText(e.target.value)
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="broadcast-title">Title</Label>
                    <Input
                      id="broadcast-title"
                      required
                      maxLength={160}
                      placeholder="e.g., New AI Keyword Engine Update"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="broadcast-message">Message</Label>
                    <Textarea
                      id="broadcast-message"
                      required
                      rows={3}
                      maxLength={1000}
                      placeholder="Write a concise announcement for your users..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-action-label">
                        Button Label (optional)
                      </Label>
                      <Input
                        id="broadcast-action-label"
                        maxLength={60}
                        placeholder="e.g., Explore Pricing"
                        value={broadcastActionLabel}
                        onChange={(e) =>
                          setBroadcastActionLabel(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-action-url">
                        Button Link (optional)
                      </Label>
                      <Input
                        id="broadcast-action-url"
                        maxLength={500}
                        placeholder="e.g., /pricing"
                        value={broadcastActionUrl}
                        onChange={(e) => setBroadcastActionUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium">Also send email</p>
                      <p className="text-xs text-muted-foreground">
                        Send email to recipients who enabled email alerts for
                        this category.
                      </p>
                    </div>
                    <Switch
                      checked={broadcastSendEmail}
                      onCheckedChange={setBroadcastSendEmail}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendBroadcastMutation.isPending}
                    className="gap-2"
                  >
                    {sendBroadcastMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Broadcast
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sent Broadcasts</CardTitle>
                <CardDescription>
                  Recent broadcast campaigns and read engagement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {broadcastsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : !broadcastsResponse?.success ||
                  !broadcastsResponse.data ||
                  broadcastsResponse.data.broadcasts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No broadcasts have been sent yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="divide-y divide-border/70">
                      {broadcastsResponse.data.broadcasts.map((item) => (
                        <div
                          key={item.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {item.title}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {BROADCAST_TARGET_LABELS[item.target] ||
                                  item.target}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.message}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatRelativeTime(item.createdAt)}
                              {item.createdBy?.name
                                ? ` · ${item.createdBy.name}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-4 text-xs">
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                {item.stats.deliveredCount} /{" "}
                                {item.stats.targetedCount}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Delivered
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                {item.stats.readRate}%
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Read rate
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {broadcastsResponse.data.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          Page {broadcastsResponse.data.pagination.page} of{" "}
                          {broadcastsResponse.data.pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              !broadcastsResponse.data.pagination.hasPrevPage
                            }
                            onClick={() =>
                              setBroadcastPage((p) => Math.max(1, p - 1))
                            }
                            className="h-7 text-xs"
                          >
                            Previous
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              !broadcastsResponse.data.pagination.hasNextPage
                            }
                            onClick={() => setBroadcastPage((p) => p + 1)}
                            className="h-7 text-xs"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
