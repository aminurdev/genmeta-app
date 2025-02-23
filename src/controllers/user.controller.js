import AppError from "../errors/app.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  throw new AppError(404, "User not found!");
});

export { registerUser };
