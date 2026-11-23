import { PROCESS_ERROR_STATUS } from "../constants/index.js";

/**
 * Parse raw error input (pipe-delimited string or string array) into clean, bounded messages.
 * @param {string|string[]|null|undefined} rawErrors
 * @param {number} [maxLength=1000]
 * @returns {string[]}
 */
export function parseErrorMessages(rawErrors, maxLength = 1000) {
  if (!rawErrors) return [];

  const inputs = Array.isArray(rawErrors) ? rawErrors : [rawErrors];
  const parsed = [];

  for (const item of inputs) {
    if (typeof item !== "string") continue;
    const parts = item
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      parsed.push(part.length > maxLength ? part.slice(0, maxLength) : part);
    }
  }

  return parsed;
}

/**
 * Normalize stored ApiUsageLog.errors array (handles legacy pipe-delimited entries).
 * @param {string[]|string|null|undefined} errors
 * @returns {string[]}
 */
export function normalizeErrorMessages(errors) {
  return parseErrorMessages(errors);
}

/**
 * Resolve effective triage status for an ApiUsageLog document (defaults legacy docs to unresolved).
 * @param {{ errorStatus?: string } | null | undefined} doc
 * @returns {"unresolved"|"resolved"|"ignored"}
 */
export function getEffectiveErrorStatus(doc) {
  const status = doc?.errorStatus;
  if (
    status === PROCESS_ERROR_STATUS.RESOLVED ||
    status === PROCESS_ERROR_STATUS.IGNORED
  ) {
    return status;
  }
  return PROCESS_ERROR_STATUS.UNRESOLVED;
}

/**
 * MongoDB filter matching ApiUsageLog documents that have recorded failures or error messages.
 */
export function buildHasErrorsFilter() {
  return {
    $or: [{ failedCount: { $gt: 0 } }, { "errors.0": { $exists: true } }],
  };
}

/**
 * MongoDB filter matching error triage status (returns null for "all" or unrecognized values).
 * @param {string} status
 */
export function buildErrorStatusFilter(status) {
  if (status === PROCESS_ERROR_STATUS.UNRESOLVED) {
    return {
      $or: [
        { errorStatus: PROCESS_ERROR_STATUS.UNRESOLVED },
        { errorStatus: { $exists: false } },
        { errorStatus: null },
      ],
    };
  }
  if (status === PROCESS_ERROR_STATUS.RESOLVED) {
    return { errorStatus: PROCESS_ERROR_STATUS.RESOLVED };
  }
  if (status === PROCESS_ERROR_STATUS.IGNORED) {
    return { errorStatus: PROCESS_ERROR_STATUS.IGNORED };
  }
  return null;
}

/**
 * Aggregate top recurring error messages with occurrence counts and distinct affected users.
 * @param {Array<{ userId?: unknown, errors?: string[]|string }>} docs
 * @param {number} [limit=6]
 * @returns {Array<{ message: string, occurrences: number, affectedUsers: number }>}
 */
export function aggregateTopErrorMessages(docs = [], limit = 6) {
  if (!Array.isArray(docs) || docs.length === 0) return [];

  const buckets = new Map();

  for (const doc of docs) {
    const messages = normalizeErrorMessages(doc?.errors);
    if (messages.length === 0) continue;

    const uid = doc?.userId ? String(doc.userId) : null;

    for (const message of messages) {
      let bucket = buckets.get(message);
      if (!bucket) {
        bucket = { message, occurrences: 0, users: new Set() };
        buckets.set(message, bucket);
      }
      bucket.occurrences += 1;
      if (uid) {
        bucket.users.add(uid);
      }
    }
  }

  return Array.from(buckets.values())
    .map((entry) => ({
      message: entry.message,
      occurrences: entry.occurrences,
      affectedUsers: entry.users.size,
    }))
    .sort((a, b) => {
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return b.affectedUsers - a.affectedUsers;
    })
    .slice(0, Math.max(0, limit));
}
