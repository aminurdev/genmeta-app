class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error description message
   * @param {Array|Object} [errors=[]] - Optional structured error details
   * @param {string} [stack=""] - Optional custom stack trace
   * @param {Object} [meta={}] - Optional metadata such as { code, data }
   */
  constructor(
    statusCode = 500,
    message = "Something went wrong",
    errors = [],
    stack = "",
    meta = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = Array.isArray(errors) ? errors : [];
    this.code = meta?.code || (errors && !Array.isArray(errors) ? errors.code : undefined);
    this.data = meta?.data || (errors && !Array.isArray(errors) ? errors.data : undefined);
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
export { ApiError };
