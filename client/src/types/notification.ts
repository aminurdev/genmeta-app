export type NotificationUserRole = "user" | "admin" | "superAdmin";

export type NotificationCategory =
  | "billing"
  | "plan"
  | "referral"
  | "security"
  | "system"
  | "announcement";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationAudience = "user" | "admin";

export type NotificationScope = "user" | "admin" | "all";

export type NotificationStatusFilter = "all" | "unread" | "read" | "archived";

export interface NotificationActor {
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface NotificationChannels {
  inApp: boolean;
  email: {
    sent: boolean;
    sentAt?: string | null;
    error?: string | null;
  };
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  audience: NotificationAudience;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  actor?: NotificationActor | null;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
  channels: NotificationChannels;
  broadcastId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationsListParams {
  scope?: NotificationScope;
  status?: NotificationStatusFilter;
  category?: NotificationCategory | "";
  priority?: NotificationPriority | "";
  search?: string;
  page?: number;
  limit?: number;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  pagination: NotificationsPagination;
  unreadCount: number;
  categoryCounts: Record<NotificationCategory, number>;
}

export interface UnreadCountResponse {
  unreadCount: number;
  byCategory: Record<NotificationCategory, number>;
}

export interface NotificationCategoryPreference {
  inApp: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
  };
  categories: Partial<
    Record<NotificationCategory, NotificationCategoryPreference>
  >;
  toastEnabled?: boolean;
  soundEnabled?: boolean;
}

export type UpdateNotificationPreferencesPayload = Partial<{
  channels: Partial<NotificationPreferences["channels"]>;
  categories: Partial<
    Record<NotificationCategory, Partial<NotificationCategoryPreference>>
  >;
  toastEnabled: boolean;
  soundEnabled: boolean;
}>;

export type BroadcastTarget =
  | "all_users"
  | "subscription_users"
  | "credit_users"
  | "free_users"
  | "admins"
  | "specific_users";

export interface BroadcastPayload {
  title: string;
  message: string;
  category: Extract<
    NotificationCategory,
    "announcement" | "system" | "billing" | "plan"
  >;
  priority: NotificationPriority;
  target: BroadcastTarget;
  targetIdentifiers?: string[];
  actionUrl?: string | null;
  actionLabel?: string | null;
  sendEmail?: boolean;
  expiresInDays?: number | null;
}

export interface NotificationBroadcastItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  target: BroadcastTarget;
  actionUrl?: string | null;
  actionLabel?: string | null;
  sendEmail: boolean;
  expiresAt?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  stats: {
    targetedCount: number;
    deliveredCount: number;
    emailSentCount: number;
    failedCount: number;
    readCount: number;
    readRate: number;
  };
}

export interface BroadcastHistoryResponse {
  broadcasts: NotificationBroadcastItem[];
  pagination: NotificationsPagination;
}
