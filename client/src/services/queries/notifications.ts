import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services/constants";
import {
  archiveNotification,
  archiveReadNotifications,
  deleteNotification,
  getAdminBroadcastHistory,
  getNotificationPreferences,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationAsUnread,
  sendAdminBroadcast,
  unarchiveNotification,
  updateNotificationPreferences,
} from "@/services/notifications";
import type { ApiResponse } from "@/types";
import type {
  BroadcastPayload,
  NotificationCategory,
  NotificationItem,
  NotificationScope,
  NotificationsListParams,
  NotificationsListResponse,
  UnreadCountResponse,
  UpdateNotificationPreferencesPayload,
} from "@/types/notification";

type ListSnapshot = Array<[QueryKey, ApiResponse<NotificationsListResponse> | undefined]>;
type CountSnapshot = Array<[QueryKey, ApiResponse<UnreadCountResponse> | undefined]>;

function broadcastCrossTabSync(reason: string) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  try {
    const channel = new BroadcastChannel("genmeta-notifications");
    channel.postMessage({ type: "sync", reason });
    channel.close();
  } catch {
    // Ignore unsupported or restricted BroadcastChannel environments
  }
}

export function useNotificationsQuery(
  params: NotificationsListParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(params as Record<string, unknown>),
    queryFn: () => getNotifications(params),
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
    staleTime: 20_000,
  });
}

export function useUnreadNotificationCountQuery(
  scope: NotificationScope = "user",
  options?: { sseConnected?: boolean; enabled?: boolean }
) {
  const sseConnected = options?.sseConnected ?? false;
  return useQuery({
    queryKey: QUERY_KEYS.notificationsUnreadCount(scope),
    queryFn: () => getUnreadNotificationCount(scope),
    enabled: options?.enabled ?? true,
    refetchInterval: sseConnected ? 5 * 60 * 1000 : 45 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export function useNotificationPreferencesQuery(
  scope: NotificationScope = "user",
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationPreferences(scope),
    queryFn: () => getNotificationPreferences(scope),
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferencesMutation(
  scope: NotificationScope = "user"
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferencesPayload) =>
      updateNotificationPreferences(payload, scope),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.setQueryData(QUERY_KEYS.notificationPreferences(scope), res);
      }
    },
  });
}

function updateCachedListItems(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (
    data: NotificationsListResponse
  ) => NotificationsListResponse
): { listSnapshots: ListSnapshot; countSnapshots: CountSnapshot } {
  const listSnapshots = queryClient.getQueriesData<
    ApiResponse<NotificationsListResponse>
  >({
    queryKey: ["notifications", "list"],
  });
  const countSnapshots = queryClient.getQueriesData<
    ApiResponse<UnreadCountResponse>
  >({
    queryKey: ["notifications", "unread-count"],
  });

  for (const [key, prev] of listSnapshots) {
    if (!prev?.success || !prev.data) continue;
    queryClient.setQueryData(key, {
      ...prev,
      data: updater(prev.data),
    });
  }

  return { listSnapshots, countSnapshots };
}

function adjustUnreadCountCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  delta: number,
  category?: NotificationCategory
) {
  const countQueries = queryClient.getQueriesData<
    ApiResponse<UnreadCountResponse>
  >({
    queryKey: ["notifications", "unread-count"],
  });

  for (const [key, prev] of countQueries) {
    if (!prev?.success || !prev.data) continue;
    const nextUnread = Math.max(0, (prev.data.unreadCount || 0) + delta);
    const nextByCat = { ...prev.data.byCategory };
    if (category && typeof nextByCat[category] === "number") {
      nextByCat[category] = Math.max(0, nextByCat[category] + delta);
    }
    queryClient.setQueryData(key, {
      ...prev,
      data: {
        unreadCount: nextUnread,
        byCategory: nextByCat,
      },
    });
  }
}

function restoreSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  context?: { listSnapshots: ListSnapshot; countSnapshots: CountSnapshot }
) {
  if (!context) return;
  for (const [key, prev] of context.listSnapshots) {
    queryClient.setQueryData(key, prev);
  }
  for (const [key, prev] of context.countSnapshots) {
    queryClient.setQueryData(key, prev);
  }
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationsAll });
      let changedItem: NotificationItem | null = null;
      const nowIso = new Date().toISOString();

      const snapshots = updateCachedListItems(queryClient, (data) => ({
        ...data,
        unreadCount: Math.max(
          0,
          data.unreadCount -
            (data.notifications.some((n) => n.id === id && !n.isRead) ? 1 : 0)
        ),
        notifications: data.notifications.map((n) => {
          if (n.id === id) {
            changedItem = n;
            return { ...n, isRead: true, readAt: nowIso };
          }
          return n;
        }),
      }));

      const item = changedItem as NotificationItem | null;
      if (item && !item.isRead) {
        adjustUnreadCountCaches(queryClient, -1, item.category);
      }

      return snapshots;
    },
    onError: (_err, _id, ctx) => {
      restoreSnapshots(queryClient, ctx);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("read");
    },
  });
}

export function useMarkNotificationUnreadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsUnread(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationsAll });
      let changedItem: NotificationItem | null = null;

      const snapshots = updateCachedListItems(queryClient, (data) => ({
        ...data,
        unreadCount:
          data.unreadCount +
          (data.notifications.some((n) => n.id === id && n.isRead) ? 1 : 0),
        notifications: data.notifications.map((n) => {
          if (n.id === id) {
            changedItem = n;
            return { ...n, isRead: false, readAt: null };
          }
          return n;
        }),
      }));

      const item = changedItem as NotificationItem | null;
      if (item && item.isRead) {
        adjustUnreadCountCaches(queryClient, 1, item.category);
      }

      return snapshots;
    },
    onError: (_err, _id, ctx) => {
      restoreSnapshots(queryClient, ctx);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("unread");
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { scope?: NotificationScope; category?: string } = {}) =>
      markAllNotificationsAsRead(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationsAll });
      const nowIso = new Date().toISOString();

      const snapshots = updateCachedListItems(queryClient, (data) => ({
        ...data,
        unreadCount: payload.category ? data.unreadCount : 0,
        notifications: data.notifications.map((n) =>
          !payload.category || n.category === payload.category
            ? { ...n, isRead: true, readAt: n.readAt || nowIso }
            : n
        ),
      }));

      if (!payload.category) {
        const countQueries = queryClient.getQueriesData<
          ApiResponse<UnreadCountResponse>
        >({
          queryKey: ["notifications", "unread-count"],
        });
        for (const [key, prev] of countQueries) {
          if (!prev?.success || !prev.data) continue;
          const zeroed: Record<string, number> = {};
          for (const cat of Object.keys(prev.data.byCategory || {})) {
            zeroed[cat] = 0;
          }
          queryClient.setQueryData(key, {
            ...prev,
            data: {
              unreadCount: 0,
              byCategory: zeroed as Record<NotificationCategory, number>,
            },
          });
        }
      }

      return snapshots;
    },
    onError: (_err, _vars, ctx) => {
      restoreSnapshots(queryClient, ctx);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("read_all");
    },
  });
}

export function useArchiveNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationsAll });
      let archivedTarget: NotificationItem | null = null;

      const snapshots = updateCachedListItems(queryClient, (data) => {
        const found = data.notifications.find((n) => n.id === id);
        if (found) archivedTarget = found;
        return {
          ...data,
          unreadCount:
            found && !found.isRead
              ? Math.max(0, data.unreadCount - 1)
              : data.unreadCount,
          notifications: data.notifications.filter((n) => n.id !== id),
        };
      });

      const item = archivedTarget as NotificationItem | null;
      if (item && !item.isRead) {
        adjustUnreadCountCaches(queryClient, -1, item.category);
      }

      return snapshots;
    },
    onError: (_err, _id, ctx) => {
      restoreSnapshots(queryClient, ctx);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("archive");
    },
  });
}

export function useUnarchiveNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unarchiveNotification(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("unarchive");
    },
  });
}

export function useArchiveReadNotificationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { scope?: NotificationScope } = {}) =>
      archiveReadNotifications(payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationsAll });
      return updateCachedListItems(queryClient, (data) => ({
        ...data,
        notifications: data.notifications.filter((n) => !n.isRead),
      }));
    },
    onError: (_err, _vars, ctx) => {
      restoreSnapshots(queryClient, ctx);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("archive_read");
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationsAll });
      let deletedTarget: NotificationItem | null = null;

      const snapshots = updateCachedListItems(queryClient, (data) => {
        const found = data.notifications.find((n) => n.id === id);
        if (found) deletedTarget = found;
        return {
          ...data,
          unreadCount:
            found && !found.isRead
              ? Math.max(0, data.unreadCount - 1)
              : data.unreadCount,
          notifications: data.notifications.filter((n) => n.id !== id),
        };
      });

      const item = deletedTarget as NotificationItem | null;
      if (item && !item.isRead) {
        adjustUnreadCountCaches(queryClient, -1, item.category);
      }

      return snapshots;
    },
    onError: (_err, _id, ctx) => {
      restoreSnapshots(queryClient, ctx);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
      broadcastCrossTabSync("delete");
    },
  });
}

export function useAdminBroadcastsQuery(
  page = 1,
  limit = 15,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: QUERY_KEYS.adminBroadcasts(page),
    queryFn: () => getAdminBroadcastHistory(page, limit),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useSendAdminBroadcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BroadcastPayload) => sendAdminBroadcast(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["notifications", "admin", "broadcasts"],
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsAll });
        broadcastCrossTabSync("broadcast");
      }
    },
  });
}
