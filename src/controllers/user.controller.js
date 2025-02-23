import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  const user = await User.create({
    name,
    email,
    password,
    loginProvider: "email",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return apiResponse(res, {
    statusCode: 201,
    message: "User registered Successfully",
    data: createdUser,
  });
});

export { registerUser };
