import { NOTIFICATION_CATEGORIES, USER_ROLES } from "../constants/index.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import notificationService from "../services/notification/notification.service.js";
import notificationStreamHub from "../services/notification/notificationStream.service.js";

function setNoStoreHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
}

function isUserAdmin(user) {
  return (
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN
  );
}

function resolveRequestedScope(rawScope, isAdmin) {
  if (!isAdmin) return "user";
  if (rawScope === "admin" || rawScope === "user" || rawScope === "all") {
    return rawScope;
  }
  return "user";
}

export const getNotifications = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(req.query.scope, isAdmin);

  const data = await notificationService.listNotifications(req.user._id, {
    scope,
    isAdmin,
    role: req.user.role,
    status: req.query.status || "all",
    category: req.query.category || null,
    priority: req.query.priority || null,
    search: req.query.search || "",
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  });

  return new ApiResponse(200, true, "Notifications retrieved", data).send(res);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(req.query.scope, isAdmin);

  const data = await notificationService.getUnreadCount(req.user._id, {
    scope,
    isAdmin,
    role: req.user.role,
  });

  return new ApiResponse(200, true, "Unread count retrieved", data).send(res);
});

export const streamNotifications = asyncHandler(async (req, res) => {
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(req.query.scope, isAdmin);

  const { unreadCount, byCategory } = await notificationService.getUnreadCount(
    req.user._id,
    { scope, isAdmin, role: req.user.role }
  );

  const cleanup = notificationStreamHub.addClient({
    userId: req.user._id,
    role: req.user.role,
    scope,
    res,
  });

  notificationStreamHub.sendEvent(res, "connected", {
    unreadCount,
    byCategory,
    scope,
    serverTime: new Date().toISOString(),
  });

  req.on("close", cleanup);
  res.on("close", cleanup);
});

export const getNotificationPreferences = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(req.query.scope, isAdmin);
  const preferences = await notificationService.getPreferences(req.user._id, {
    role: req.user.role,
    scope,
  });
  return new ApiResponse(
    200,
    true,
    "Notification preferences retrieved",
    { preferences }
  ).send(res);
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(
    req.body?.scope || req.query?.scope,
    isAdmin
  );
  const preferences = await notificationService.updatePreferences(
    req.user._id,
    req.body,
    { role: req.user.role, scope }
  );
  return new ApiResponse(
    200,
    true,
    "Notification preferences updated",
    { preferences }
  ).send(res);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const data = await notificationService.markAsRead(req.user._id, req.params.id);
  return new ApiResponse(200, true, "Notification marked as read", data).send(res);
});

export const markNotificationUnread = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const data = await notificationService.markAsUnread(req.user._id, req.params.id);
  return new ApiResponse(200, true, "Notification marked as unread", data).send(res);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(
    req.body?.scope || req.query?.scope,
    isAdmin
  );
  const category = req.body?.category || req.query?.category || null;

  const data = await notificationService.markAllAsRead(req.user._id, {
    scope,
    isAdmin,
    category,
  });

  return new ApiResponse(200, true, "All notifications marked as read", data).send(
    res
  );
});

export const archiveNotification = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const data = await notificationService.archiveNotification(
    req.user._id,
    req.params.id
  );
  return new ApiResponse(200, true, "Notification archived", data).send(res);
});

export const unarchiveNotification = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const data = await notificationService.unarchiveNotification(
    req.user._id,
    req.params.id
  );
  return new ApiResponse(200, true, "Notification restored from archive", data).send(
    res
  );
});

export const archiveAllReadNotifications = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const isAdmin = isUserAdmin(req.user);
  const scope = resolveRequestedScope(
    req.body?.scope || req.query?.scope,
    isAdmin
  );

  const data = await notificationService.archiveAllRead(req.user._id, {
    scope,
    isAdmin,
  });

  return new ApiResponse(200, true, "Read notifications archived", data).send(res);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const data = await notificationService.deleteNotification(
    req.user._id,
    req.params.id
  );
  return new ApiResponse(200, true, "Notification deleted", data).send(res);
});

export const sendBroadcastNotification = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  if (
    req.body.category === NOTIFICATION_CATEGORIES.SYSTEM &&
    req.user.role !== USER_ROLES.SUPER_ADMIN
  ) {
    throw new ApiError(
      403,
      "Only SuperAdmins can broadcast system notifications"
    );
  }

  const broadcast = await notificationService.sendBroadcast({
    ...req.body,
    createdBy: req.user._id,
    actor: {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar || null,
    },
  });

  return new ApiResponse(201, true, "Broadcast notification sent", {
    broadcast,
  }).send(res);
});

export const getBroadcastHistory = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const data = await notificationService.getBroadcastHistory({
    page: req.query.page || 1,
    limit: req.query.limit || 15,
  });

  return new ApiResponse(200, true, "Broadcast history retrieved", data).send(res);
});
