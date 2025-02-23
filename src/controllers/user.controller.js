import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req) => {
  throw new ApiError(
    200,
    `Email and password are required! ${req.originalUrl}`
  );
});

export { registerUser };
