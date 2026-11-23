import crypto from "crypto";

const MAX_CONNECTIONS_PER_USER = 6;
const HEARTBEAT_INTERVAL_MS = 25000;

/**
 * In-memory Server-Sent Events (SSE) hub for real-time notification delivery.
 */
export class NotificationStreamHub {
  constructor({
    maxConnectionsPerUser = MAX_CONNECTIONS_PER_USER,
    heartbeatIntervalMs = HEARTBEAT_INTERVAL_MS,
  } = {}) {
    this.clientsByUser = new Map();
    this.maxConnectionsPerUser = maxConnectionsPerUser;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
  }

  /**
   * Register an authenticated SSE response stream for a user.
   * Returns an idempotent cleanup function.
   */
  addClient({ userId, role = "user", scope = "user", res }) {
    const uid = String(userId);
    const clientId = crypto.randomUUID();

    if (typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
    }

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    let userSet = this.clientsByUser.get(uid);
    if (!userSet) {
      userSet = new Set();
      this.clientsByUser.set(uid, userSet);
    }

    // Evict oldest connections if the user exceeds the per-user cap
    while (userSet.size >= this.maxConnectionsPerUser) {
      const oldest = userSet.values().next().value;
      if (!oldest) break;
      this.removeClient(oldest, { closeStream: true });
    }

    const client = {
      id: clientId,
      userId: uid,
      role,
      scope: scope || "user",
      res,
      heartbeatTimer: null,
      closed: false,
      createdAt: Date.now(),
    };

    const cleanup = () => {
      this.removeClient(client, { closeStream: false });
    };
    client.cleanup = cleanup;

    client.heartbeatTimer = setInterval(() => {
      if (client.closed) return;
      try {
        res.write(": heartbeat\n\n");
      } catch {
        cleanup();
      }
    }, this.heartbeatIntervalMs);
    client.heartbeatTimer.unref?.();

    userSet.add(client);
    return cleanup;
  }

  removeClient(client, { closeStream = false } = {}) {
    if (!client || client.closed) return;
    client.closed = true;

    if (client.heartbeatTimer) {
      clearInterval(client.heartbeatTimer);
      client.heartbeatTimer = null;
    }

    const userSet = this.clientsByUser.get(client.userId);
    if (userSet) {
      userSet.delete(client);
      if (userSet.size === 0) {
        this.clientsByUser.delete(client.userId);
      }
    }

    if (closeStream && typeof client.res?.end === "function") {
      try {
        client.res.end();
      } catch {
        // Ignore already-closed stream errors
      }
    }
  }

  sendEvent(res, eventName, data) {
    if (!res || res.writableEnded || res.destroyed) {
      return false;
    }
    try {
      const serialized = JSON.stringify(data ?? {});
      res.write(`event: ${eventName}\ndata: ${serialized}\n\n`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Push an SSE event to all active connections for a user matching audience scope.
   */
  emitToUser(userId, eventName, payload, { audience = null } = {}) {
    if (!userId) return 0;
    const userSet = this.clientsByUser.get(String(userId));
    if (!userSet || userSet.size === 0) return 0;

    let delivered = 0;
    for (const client of Array.from(userSet)) {
      if (audience && client.scope !== "all" && client.scope !== audience) {
        continue;
      }

      const ok = this.sendEvent(client.res, eventName, payload);
      if (ok) {
        delivered += 1;
      } else {
        this.removeClient(client, { closeStream: false });
      }
    }

    return delivered;
  }

  /**
   * Check whether a user currently has at least one active SSE connection.
   */
  hasActiveClient(userId) {
    const userSet = this.clientsByUser.get(String(userId));
    return Boolean(userSet && userSet.size > 0);
  }

  /**
   * Close all active SSE streams cleanly (e.g., on server shutdown).
   */
  closeAll() {
    for (const userSet of Array.from(this.clientsByUser.values())) {
      for (const client of Array.from(userSet)) {
        this.removeClient(client, { closeStream: true });
      }
    }
    this.clientsByUser.clear();
  }

  getStats() {
    let totalConnections = 0;
    for (const userSet of this.clientsByUser.values()) {
      totalConnections += userSet.size;
    }
    return {
      totalConnections,
      uniqueUsers: this.clientsByUser.size,
    };
  }
}

export const notificationStreamHub = new NotificationStreamHub();
export default notificationStreamHub;
