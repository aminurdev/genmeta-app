import { StatusCodes } from "http-status-codes";

const notFound = (req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "API Not Found !!",
    error: { path: req.originalUrl, message: "API not found" },
  });
};

export { notFound };
