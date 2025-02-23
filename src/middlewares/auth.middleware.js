import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";

export const verifyToken = async (req, _, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, false, "Unauthorized request");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.access_token_secret);
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, false, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    throw new ApiError(401, false, "Unauthorized request");
  }
};
