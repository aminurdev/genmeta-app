import { ZodError } from "zod";
import config from "../config/index.js";
import handleZodError from "../errors/zod.error.js";
import AppError from "../errors/app.error.js";

class GlobalErrorHandler {
  constructor(err, req) {
    // Default values
    this.statusCode = err.statusCode || 500;
    this.message = err.message || "Internal Server Error!";
    this.error = [
      {
        path: req.originalUrl,
        message: "Internal Server Error!",
      },
    ];
    this.stack = config.NODE_ENV === "development" ? err?.stack : null;

    // Process the error
    this.processError(err);
  }

  processError(err) {
    if (err instanceof ZodError) {
      const simplifiedError = handleZodError(err);
      this.setErrorDetails(simplifiedError);
    } else if (err instanceof AppError) {
      this.statusCode = err?.statusCode;
      this.message = err.message;
      this.error = [{ path: "", message: err?.message }];
    }
  }

  setErrorDetails(errorData) {
    this.statusCode = errorData.statusCode;
    this.message = errorData.message;
    this.error = errorData.error;
  }

  sendResponse(res) {
    return res.status(this.statusCode).json({
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      error: this.error,
      stack: this.stack,
    });
  }

  static handleError(err, req, res) {
    const errorHandler = new GlobalErrorHandler(err, req);
    return errorHandler.sendResponse(res);
  }
}

export default GlobalErrorHandler.handleError;
