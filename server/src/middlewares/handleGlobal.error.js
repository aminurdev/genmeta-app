import config from "../config/index.js";

/**
 * Global centralized error handling middleware
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // 1. Handle JSON Syntax error from body-parser
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON syntax in request body";
  }

  // 2. Handle Zod validation errors
  if (err.name === "ZodError" && err.issues) {
    statusCode = 400;
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    message = errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join("; ");
  }

  // 3. Handle Mongoose validation errors
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // 4. Handle Mongoose cast errors (invalid ObjectId, type mismatches)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // 5. Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyPattern || {})[0] || "field";
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : "";
    message = `${duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)} '${duplicatedValue}' already exists`;
  }

  // 6. Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token signature";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  }

  // Log 500 unexpected errors
  if (statusCode >= 500) {
    console.error("💥 Unhandled Error:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: config.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
