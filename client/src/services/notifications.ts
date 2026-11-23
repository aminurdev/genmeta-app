import { api } from "@/services/api-client";
import type { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";
import type {
  BroadcastHistoryResponse,
  BroadcastPayload,
  NotificationBroadcastItem,
  NotificationItem,
  NotificationPreferences,
  NotificationScope,
  NotificationsListParams,
  NotificationsListResponse,
  UnreadCountResponse,
  UpdateNotificationPreferencesPayload,
} from "@/types/notification";

function extractError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const err = error as AxiosApiError;
  return (
    err.response?.data ?? {
      success: false,
      statusCode: err.response?.status ?? 500,
      message: err.response?.data?.message || err.message || fallbackMessage,
    }
  );
}

export const getNotifications = async (
  params: NotificationsListParams = {}
): Promise<ApiResponse<NotificationsListResponse> | ApiErrorResponse> => {
  try {
    const query: Record<string, string | number> = {};
    if (params.scope) query.scope = params.scope;
    if (params.status) query.status = params.status;
    if (params.category) query.category = params.category;
    if (params.priority) query.priority = params.priority;
    if (params.search?.trim()) query.search = params.search.trim();
    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;

    const result = await api.get("/notifications", { params: query });
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to load notifications");
  }
};

export const getUnreadNotificationCount = async (
  scope: NotificationScope = "user"
): Promise<ApiResponse<UnreadCountResponse> | ApiErrorResponse> => {
  try {
    const result = await api.get("/notifications/unread-count", {
      params: { scope },
    });
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to load unread notification count");
  }
};

export const getNotificationPreferences = async (
  scope: NotificationScope = "user"
): Promise<
  ApiResponse<{ preferences: NotificationPreferences }> | ApiErrorResponse
> => {
  try {
    const result = await api.get("/notifications/preferences", {
      params: { scope },
    });
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to load notification preferences");
  }
};

export const updateNotificationPreferences = async (
  payload: UpdateNotificationPreferencesPayload,
  scope: NotificationScope = "user"
): Promise<
  ApiResponse<{ preferences: NotificationPreferences }> | ApiErrorResponse
> => {
  try {
    const result = await api.put("/notifications/preferences", payload, {
      params: { scope },
    });
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to update notification preferences");
  }
};

export const markNotificationAsRead = async (
  id: string
): Promise<
  | ApiResponse<{ notification: NotificationItem; unreadCount: number }>
  | ApiErrorResponse
> => {
  try {
    const result = await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to mark notification as read");
  }
};

export const markNotificationAsUnread = async (
  id: string
): Promise<
  | ApiResponse<{ notification: NotificationItem; unreadCount: number }>
  | ApiErrorResponse
> => {
  try {
    const result = await api.patch(
      `/notifications/${encodeURIComponent(id)}/unread`
    );
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to mark notification as unread");
  }
};

export const markAllNotificationsAsRead = async (
  payload: { scope?: NotificationScope; category?: string } = {}
): Promise<
  ApiResponse<{ modifiedCount: number; unreadCount: number }> | ApiErrorResponse
> => {
  try {
    const result = await api.patch("/notifications/read-all", payload);
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to mark all notifications as read");
  }
};

export const archiveNotification = async (
  id: string
): Promise<
  | ApiResponse<{ notification: NotificationItem; unreadCount: number }>
  | ApiErrorResponse
> => {
  try {
    const result = await api.patch(
      `/notifications/${encodeURIComponent(id)}/archive`
    );
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to archive notification");
  }
};

export const unarchiveNotification = async (
  id: string
): Promise<
  | ApiResponse<{ notification: NotificationItem; unreadCount: number }>
  | ApiErrorResponse
> => {
  try {
    const result = await api.patch(
      `/notifications/${encodeURIComponent(id)}/unarchive`
    );
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to restore notification");
  }
};

export const archiveReadNotifications = async (
  payload: { scope?: NotificationScope } = {}
): Promise<
  ApiResponse<{ modifiedCount: number; unreadCount: number }> | ApiErrorResponse
> => {
  try {
    const result = await api.post("/notifications/archive-read", payload);
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to archive read notifications");
  }
};

export const deleteNotification = async (
  id: string
): Promise<
  ApiResponse<{ id: string; unreadCount: number }> | ApiErrorResponse
> => {
  try {
    const result = await api.delete(`/notifications/${encodeURIComponent(id)}`);
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to delete notification");
  }
};

export const sendAdminBroadcast = async (
  payload: BroadcastPayload
): Promise<
  ApiResponse<{ broadcast: NotificationBroadcastItem }> | ApiErrorResponse
> => {
  try {
    const result = await api.post("/notifications/admin/broadcast", payload);
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to send broadcast notification");
  }
};

export const getAdminBroadcastHistory = async (
  page = 1,
  limit = 15
): Promise<ApiResponse<BroadcastHistoryResponse> | ApiErrorResponse> => {
  try {
    const result = await api.get("/notifications/admin/broadcasts", {
      params: { page, limit },
    });
    return result.data;
  } catch (error) {
    return extractError(error, "Failed to fetch broadcast history");
  }
};
