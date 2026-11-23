"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/services/constants";
import type { ApiResponse } from "@/types";
import type {
  NotificationItem,
  NotificationScope,
  UnreadCountResponse,
} from "@/types/notification";

export type StreamConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface UseNotificationStreamOptions {
  scope: NotificationScope;
  enabled?: boolean;
  enableToast?: boolean;
}

export function useNotificationStream({
  scope,
  enabled = true,
  enableToast = true,
}: UseNotificationStreamOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StreamConnectionStatus>(
    enabled ? "connecting" : "disconnected"
  );

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const enableToastRef = useRef(enableToast);
  useEffect(() => {
    enableToastRef.current = enableToast;
  }, [enableToast]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;
    let disposed = false;

    const updateUnreadCountCache = (
      unreadCount: number,
      byCategory?: Record<string, number>
    ) => {
      const targetScopes: NotificationScope[] =
        scope === "all" ? ["all", "admin", "user"] : [scope];

      for (const s of targetScopes) {
        queryClient.setQueryData<ApiResponse<UnreadCountResponse>>(
          QUERY_KEYS.notificationsUnreadCount(s),
          (prev) => {
            if (!prev || !prev.success || !prev.data) {
              return {
                success: true,
                statusCode: 200,
                data: {
                  unreadCount,
                  byCategory: (byCategory || {}) as UnreadCountResponse["byCategory"],
                },
              };
            }
            return {
              ...prev,
              data: {
                unreadCount,
                byCategory:
                  (byCategory as UnreadCountResponse["byCategory"]) ||
                  prev.data.byCategory,
              },
            };
          }
        );
      }
    };

    const connect = () => {
      if (disposed) return;

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      const streamUrl = `/api/v1/notifications/stream?scope=${encodeURIComponent(
        scope
      )}`;
      const es = new EventSource(streamUrl, { withCredentials: true });
      eventSource = es;

      es.addEventListener("connected", (event) => {
        if (disposed) return;
        retryAttempt = 0;
        setStatus("connected");
        try {
          const payload = JSON.parse((event as MessageEvent).data || "{}") as {
            unreadCount?: number;
            byCategory?: Record<string, number>;
          };
          if (typeof payload.unreadCount === "number") {
            updateUnreadCountCache(payload.unreadCount, payload.byCategory);
          }
        } catch {
          // Ignore malformed connected payload
        }
      });

      es.addEventListener("notification:new", (event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse((event as MessageEvent).data || "{}") as {
            notification?: NotificationItem;
            unreadCount?: number;
          };

          if (typeof payload.unreadCount === "number") {
            updateUnreadCountCache(payload.unreadCount);
          }

          queryClient.invalidateQueries({
            queryKey: ["notifications", "list"],
          });
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread-count"],
          });

          const notif = payload.notification;
          if (notif && enableToastRef.current) {
            const actionOpt = notif.actionUrl
              ? {
                  label: notif.actionLabel || "View",
                  onClick: () => routerRef.current.push(notif.actionUrl!),
                }
              : undefined;

            if (notif.priority === "urgent") {
              toast.error(notif.title, {
                description: notif.message,
                action: actionOpt,
                duration: 6000,
              });
            } else if (notif.priority === "high") {
              toast.warning(notif.title, {
                description: notif.message,
                action: actionOpt,
                duration: 5000,
              });
            } else {
              toast.info(notif.title, {
                description: notif.message,
                action: actionOpt,
                duration: 4000,
              });
            }
          }
        } catch {
          // Ignore malformed event data
        }
      });

      const handleSyncEvent = (event: Event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse((event as MessageEvent).data || "{}") as {
            unreadCount?: number;
          };
          if (typeof payload.unreadCount === "number") {
            updateUnreadCountCache(payload.unreadCount);
          }
        } catch {
          // Ignore parse error
        }
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
        });
      };

      es.addEventListener("notification:updated", handleSyncEvent);
      es.addEventListener("notification:deleted", handleSyncEvent);
      es.addEventListener("notification:bulk", handleSyncEvent);

      es.onerror = () => {
        if (disposed) return;
        es.close();
        eventSource = null;
        setStatus("reconnecting");

        const baseDelay = Math.min(30_000, 2_000 * 2 ** retryAttempt);
        const jitter = Math.floor(Math.random() * 1000);
        retryAttempt = Math.min(retryAttempt + 1, 5);

        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          connect();
        }, baseDelay + jitter);
      };
    };

    const initTimer = setTimeout(connect, 0);

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        broadcastChannel = new BroadcastChannel("genmeta-notifications");
        broadcastChannel.onmessage = () => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.notificationsAll,
          });
        };
      } catch {
        broadcastChannel = null;
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.notificationsAll,
        });
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          retryAttempt = 0;
          if (reconnectTimer) clearTimeout(reconnectTimer);
          connect();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      clearTimeout(initTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, queryClient, scope]);

  return {
    connectionStatus: enabled ? status : "disconnected",
    isConnected: enabled && status === "connected",
  };
}
