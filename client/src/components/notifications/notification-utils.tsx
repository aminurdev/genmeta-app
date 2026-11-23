import {
  CreditCard,
  Gift,
  Megaphone,
  Server,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import type {
  BroadcastTarget,
  NotificationCategory,
  NotificationItem,
  NotificationPriority,
  NotificationUserRole,
} from "@/types/notification";

export interface CategoryMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  iconBgClass: string;
  iconTextClass: string;
}

export const CATEGORY_META: Record<NotificationCategory, CategoryMeta> = {
  billing: {
    label: "Billing & Payments",
    description: "Payment confirmations, receipts, and failed checkouts",
    icon: CreditCard,
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-600 dark:text-emerald-400",
  },
  plan: {
    label: "Plan & Credits",
    description: "Plan updates, credit top-ups, and expiry reminders",
    icon: Sparkles,
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    iconBgClass: "bg-blue-500/10",
    iconTextClass: "text-blue-600 dark:text-blue-400",
  },
  referral: {
    label: "Referrals & Payouts",
    description: "New referral sign-ups, commissions, and withdrawal status",
    icon: Gift,
    badgeClass:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    iconBgClass: "bg-purple-500/10",
    iconTextClass: "text-purple-600 dark:text-purple-400",
  },
  security: {
    label: "Security",
    description: "Password changes, device resets, and account alerts",
    icon: ShieldAlert,
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    iconBgClass: "bg-rose-500/10",
    iconTextClass: "text-rose-600 dark:text-rose-400",
  },
  system: {
    label: "System & Backups",
    description: "Scheduled maintenance and database backup alerts",
    icon: Server,
    badgeClass:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    iconBgClass: "bg-slate-500/10",
    iconTextClass: "text-slate-600 dark:text-slate-400",
  },
  announcement: {
    label: "Announcements",
    description: "Product updates and platform news",
    icon: Megaphone,
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    iconBgClass: "bg-amber-500/10",
    iconTextClass: "text-amber-600 dark:text-amber-400",
  },
};

const ADMIN_CATEGORY_COPY: Partial<
  Record<NotificationCategory, { label: string; description: string }>
> = {
  billing: {
    label: "Payments",
    description: "Customer payments and fulfillment alerts",
  },
  referral: {
    label: "Withdrawal Requests",
    description: "New referral payout requests awaiting review",
  },
  security: {
    label: "Security & Fraud",
    description: "Payment integrity alerts and staff role changes",
  },
  system: {
    label: "System & Backups",
    description: "Scheduled maintenance and database backup alerts",
  },
  announcement: {
    label: "Team Broadcasts",
    description: "Internal admin announcements",
  },
};

export function getRoleCategories(
  role: NotificationUserRole,
  scope: "user" | "admin"
): NotificationCategory[] {
  if (scope === "admin" && role === "superAdmin") {
    return ["billing", "referral", "security", "system", "announcement"];
  }
  if (scope === "admin" && role === "admin") {
    return ["billing", "referral", "security", "announcement"];
  }
  return ["billing", "plan", "referral", "security", "announcement"];
}

export function getCategoryDisplayMeta(
  category: NotificationCategory,
  scope: "user" | "admin"
): CategoryMeta {
  const base = CATEGORY_META[category] || CATEGORY_META.announcement;
  if (scope === "admin") {
    const override = ADMIN_CATEGORY_COPY[category];
    if (override) {
      return {
        ...base,
        label: override.label,
        description: override.description,
      };
    }
  }
  return base;
}

export const PRIORITY_META: Record<
  NotificationPriority,
  { label: string; className: string }
> = {
  urgent: {
    label: "Urgent",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  },
  high: {
    label: "Important",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  normal: {
    label: "Normal",
    className: "bg-muted text-muted-foreground border-border",
  },
  low: {
    label: "Low",
    className: "bg-muted/70 text-muted-foreground border-border/70",
  },
};

export const BROADCAST_TARGET_LABELS: Record<BroadcastTarget, string> = {
  all_users: "All Active Users",
  subscription_users: "Subscription Plan Users",
  credit_users: "Credit Pack Users",
  free_users: "Free Tier Users",
  admins: "Admins & SuperAdmins",
  specific_users: "Specific Users",
};

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Just now";
  try {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return "Just now";
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return "Just now";
  }
}

export function getDateGroupLabel(dateStr?: string | null): string {
  if (!dateStr) return "Earlier";
  try {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return "Earlier";
    if (isToday(parsed)) return "Today";
    if (isYesterday(parsed)) return "Yesterday";
    return "Earlier";
  } catch {
    return "Earlier";
  }
}

export function groupNotificationsByDate(
  items: NotificationItem[]
): Array<{ label: string; items: NotificationItem[] }> {
  const groups = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const label = getDateGroupLabel(item.createdAt);
    const list = groups.get(label);
    if (list) {
      list.push(item);
    } else {
      groups.set(label, [item]);
    }
  }
  return Array.from(groups.entries()).map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));
}

export function getInitials(name?: string | null): string {
  if (!name) return "U";
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  );
}
