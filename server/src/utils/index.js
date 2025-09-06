import { User } from "../models/user.model.js";
import ApiError from "./api.error.js";

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export const generateCode = (length = 6, letterRatio = 0.7) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let code = "";

  // First character must be a letter
  code += letters[Math.floor(Math.random() * letters.length)];

  // Generate remaining characters
  for (let i = 1; i < length; i++) {
    if (Math.random() < letterRatio) {
      code += letters[Math.floor(Math.random() * letters.length)];
    } else {
      code += numbers[Math.floor(Math.random() * numbers.length)];
    }
  }

  return code;
};
