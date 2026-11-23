import test from "node:test";
import assert from "node:assert/strict";

// Deterministic test env defaults BEFORE importing config-dependent modules
process.env.NODE_ENV = "test";
process.env.GEMINI_ENCODER_KEY ||= "test-encoder-key";
process.env.SESSION_SECRET ||= "test-session-secret";
process.env.ACCESS_TOKEN_SECRET ||= "test-access-secret";
process.env.REFRESH_TOKEN_SECRET ||= "test-refresh-secret";
process.env.EMAIL_VERIFY_TOKEN_SECRET ||= "test-email-verify-secret";

const { PROCESS_ERROR_STATUS } = await import("../src/constants/index.js");
const {
  aggregateTopErrorMessages,
  buildErrorStatusFilter,
  buildHasErrorsFilter,
  getEffectiveErrorStatus,
  normalizeErrorMessages,
  parseErrorMessages,
} = await import("../src/utils/processError.utils.js");
const {
  bulkUpdateProcessErrorStatusSchema,
  updateProcessErrorStatusSchema,
} = await import("../src/validations/index.js");

test("parseErrorMessages splits pipe-delimited strings, trims, and filters empty values", () => {
  assert.deepEqual(parseErrorMessages(null), []);
  assert.deepEqual(parseErrorMessages(""), []);
  assert.deepEqual(parseErrorMessages("   |  | "), []);
  assert.deepEqual(
    parseErrorMessages("Rate limit exceeded |  Timeout error |  "),
    ["Rate limit exceeded", "Timeout error"]
  );
  assert.deepEqual(
    parseErrorMessages(["First | Second", "  Third  ", null, 123]),
    ["First", "Second", "Third"]
  );
});

test("parseErrorMessages caps message length to maxLength", () => {
  const longMsg = "x".repeat(50);
  assert.deepEqual(parseErrorMessages(longMsg, 20), ["x".repeat(20)]);
  assert.deepEqual(normalizeErrorMessages(["a | b", "c"]), ["a", "b", "c"]);
});

test("getEffectiveErrorStatus handles legacy docs without errorStatus", () => {
  assert.equal(getEffectiveErrorStatus(null), PROCESS_ERROR_STATUS.UNRESOLVED);
  assert.equal(getEffectiveErrorStatus({}), PROCESS_ERROR_STATUS.UNRESOLVED);
  assert.equal(
    getEffectiveErrorStatus({ errorStatus: undefined }),
    PROCESS_ERROR_STATUS.UNRESOLVED
  );
  assert.equal(
    getEffectiveErrorStatus({ errorStatus: "resolved" }),
    PROCESS_ERROR_STATUS.RESOLVED
  );
  assert.equal(
    getEffectiveErrorStatus({ errorStatus: "ignored" }),
    PROCESS_ERROR_STATUS.IGNORED
  );
});

test("buildHasErrorsFilter and buildErrorStatusFilter return expected Mongo filters", () => {
  assert.deepEqual(buildHasErrorsFilter(), {
    $or: [{ failedCount: { $gt: 0 } }, { "errors.0": { $exists: true } }],
  });

  assert.deepEqual(buildErrorStatusFilter("unresolved"), {
    $or: [
      { errorStatus: "unresolved" },
      { errorStatus: { $exists: false } },
      { errorStatus: null },
    ],
  });
  assert.deepEqual(buildErrorStatusFilter("resolved"), { errorStatus: "resolved" });
  assert.deepEqual(buildErrorStatusFilter("ignored"), { errorStatus: "ignored" });
  assert.equal(buildErrorStatusFilter("all"), null);
});

test("aggregateTopErrorMessages counts occurrences and distinct users, sorted descending", () => {
  const docs = [
    { userId: "u1", errors: ["Quota exceeded | Network timeout"] },
    { userId: "u1", errors: ["Quota exceeded"] },
    { userId: "u2", errors: ["Quota exceeded", "Invalid API key"] },
    { userId: "u3", errors: ["Invalid API key"] },
    { userId: "u4", errors: ["Disk full"] },
  ];

  const top = aggregateTopErrorMessages(docs, 2);
  assert.deepEqual(top, [
    { message: "Quota exceeded", occurrences: 3, affectedUsers: 2 },
    { message: "Invalid API key", occurrences: 2, affectedUsers: 2 },
  ]);
});

test("updateProcessErrorStatusSchema validates status and optional resolutionNote", () => {
  const valid = updateProcessErrorStatusSchema.safeParse({
    status: "resolved",
    resolutionNote: "  Fixed in v2.1  ",
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.resolutionNote, "Fixed in v2.1");

  const invalidStatus = updateProcessErrorStatusSchema.safeParse({
    status: "closed",
  });
  assert.equal(invalidStatus.success, false);

  const tooLongNote = updateProcessErrorStatusSchema.safeParse({
    status: "ignored",
    resolutionNote: "a".repeat(501),
  });
  assert.equal(tooLongNote.success, false);
});

test("bulkUpdateProcessErrorStatusSchema validates ids vs resolveAllUnresolved", () => {
  const emptyBoth = bulkUpdateProcessErrorStatusSchema.safeParse({
    status: "resolved",
  });
  assert.equal(emptyBoth.success, false);

  const validIds = bulkUpdateProcessErrorStatusSchema.safeParse({
    ids: ["507f1f77bcf86cd799439011"],
    status: "ignored",
  });
  assert.equal(validIds.success, true);

  const invalidResolveAllStatus = bulkUpdateProcessErrorStatusSchema.safeParse({
    resolveAllUnresolved: true,
    status: "unresolved",
  });
  assert.equal(invalidResolveAllStatus.success, false);

  const validResolveAll = bulkUpdateProcessErrorStatusSchema.safeParse({
    resolveAllUnresolved: true,
    status: "resolved",
    resolutionNote: "Cleared backlog",
  });
  assert.equal(validResolveAll.success, true);
});
