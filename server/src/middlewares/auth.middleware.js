import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyToken = asyncHandler(async (req, _, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized request");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.access_token_secret);
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken -verificationToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});
