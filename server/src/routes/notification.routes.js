import express from "express";
import {
  archiveAllReadNotifications,
  archiveNotification,
  deleteNotification,
  getBroadcastHistory,
  getNotificationPreferences,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  sendBroadcastNotification,
  streamNotifications,
  unarchiveNotification,
  updateNotificationPreferences,
} from "../controllers/notification.controller.js";
import {
  authenticateAndVerifyAdmin,
  verifyUser,
} from "../middlewares/auth.middleware.js";
import {
  adminBroadcastLimiter,
  notificationActionLimiter,
} from "../middlewares/rate.limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  broadcastNotificationSchema,
  listNotificationsQuerySchema,
  updateNotificationPreferencesSchema,
} from "../validations/index.js";

const router = express.Router();

// Authenticated user notification endpoints
router.get(
  "/",
  verifyUser,
  validate(listNotificationsQuerySchema, "query"),
  getNotifications
);
router.get("/unread-count", verifyUser, getUnreadCount);
router.get("/stream", verifyUser, streamNotifications);
router.get("/preferences", verifyUser, getNotificationPreferences);
router.put(
  "/preferences",
  verifyUser,
  validate(updateNotificationPreferencesSchema),
  updateNotificationPreferences
);

router.patch(
  "/read-all",
  verifyUser,
  notificationActionLimiter,
  markAllNotificationsRead
);
router.post(
  "/archive-read",
  verifyUser,
  notificationActionLimiter,
  archiveAllReadNotifications
);

// Admin broadcast management endpoints
router.post(
  "/admin/broadcast",
  authenticateAndVerifyAdmin,
  adminBroadcastLimiter,
  validate(broadcastNotificationSchema),
  sendBroadcastNotification
);
router.get(
  "/admin/broadcasts",
  authenticateAndVerifyAdmin,
  getBroadcastHistory
);

// Single notification item operations
router.patch(
  "/:id/read",
  verifyUser,
  notificationActionLimiter,
  markNotificationRead
);
router.patch(
  "/:id/unread",
  verifyUser,
  notificationActionLimiter,
  markNotificationUnread
);
router.patch(
  "/:id/archive",
  verifyUser,
  notificationActionLimiter,
  archiveNotification
);
router.patch(
  "/:id/unarchive",
  verifyUser,
  notificationActionLimiter,
  unarchiveNotification
);
router.delete(
  "/:id",
  verifyUser,
  notificationActionLimiter,
  deleteNotification
);

export default router;
