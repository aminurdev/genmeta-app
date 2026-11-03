import passport from "passport";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { AppKey } from "../models/appKey.model.js";
import { generateAppKey } from "./appKey.controller.js";
import { PLAN_TYPES } from "../constants/index.js";

export const googleLoginAPP = asyncHandler(async (req, res, next) => {
  const { state } = req.query;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: state || undefined,
  })(req, res, next);
});

export const googleCallback = asyncHandler(async (req, res, next) => {
  const { state, error, error_description } = req.query;

  let parsedState = {};
  try {
    parsedState = state ? JSON.parse(state) : {};
  } catch {
    parsedState = {};
  }

  if (error) {
    console.log("Google OAuth Error (App):", error, error_description);

    if (parsedState.state) {
      const errorUrl = `genmeta://auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || "Authentication cancelled")}&state=${encodeURIComponent(state)}`;

      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Authentication Cancelled</title>
          <style>
            body { font-family: sans-serif; background: #f7f9fc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
            .container { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px 40px; max-width: 400px; width: 90%; }
            h2 { color: #e53e3e; margin-top: 0; }
          </style>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              window.location.replace('${errorUrl}');
            });
          </script>
        </head>
        <body>
          <div class="container">
            <h2>Authentication Cancelled</h2>
            <p>Redirecting you back to the application...</p>
          </div>
        </body>
        </html>
      `;
      return res.send(errorHtml);
    }
    throw new ApiError(401, `Google Auth Failed: ${error}`);
  }

  passport.authenticate("google", { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        if (parsedState.state) {
          const errorUrl = `genmeta://auth?error=auth_failed&state=${encodeURIComponent(parsedState.state)}`;
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head><script>window.location.replace('${errorUrl}');</script></head>
            <body><p>Authentication Failed. Redirecting...</p></body>
            </html>
          `);
        }
        throw new ApiError(401, "Google Authentication Failed");
      }

      const accessToken = user.generateAccessToken();

      if (parsedState.state) {
        const redirectUrl = `genmeta://auth?token=${encodeURIComponent(accessToken)}&state=${encodeURIComponent(parsedState.state)}`;
        const successHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Authentication Complete</title>
            <style>
              body { font-family: sans-serif; background: #f7f9fc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
              .container { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px 40px; max-width: 400px; width: 90%; }
              h2 { color: #2e7d32; margin-top: 0; }
            </style>
            <script>
              document.addEventListener('DOMContentLoaded', function() {
                window.location.replace('${redirectUrl}');
              });
            </script>
          </head>
          <body>
            <div class="container">
              <h2>Authentication Successful</h2>
              <p>You have signed in successfully. Returning to GenMeta...</p>
            </div>
          </body>
          </html>
        `;
        return res.send(successHtml);
      }

      return new ApiResponse(200, true, "Google authentication successful", {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      }).send(res);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

export const appUserLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isVerified) {
    throw new ApiError(404, "User not found or email not verified");
  }

  if (!user.loginProvider.includes("email")) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const appKeyDoc = await findOrCreateAppKey(user);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    apiKey: appKeyDoc.key,
  }).send(res);
});

export const verifyGoogle = asyncHandler(async (req, res) => {
  const user = req.user;
  const appKeyDoc = await findOrCreateAppKey(user);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    apiKey: appKeyDoc.key,
  }).send(res);
});

const findOrCreateAppKey = async (user) => {
  let appKey = await AppKey.findOne({ userId: user._id });

  if (!appKey) {
    const today = new Date().toISOString().split("T")[0];
    appKey = await AppKey.create({
      userId: user._id,
      username: user.email,
      key: generateAppKey(),
      plan: { type: PLAN_TYPES.FREE },
      credit: 10,
      lastCreditRefresh: today,
      monthlyProcess: new Map([[today.substring(0, 7), 0]]),
      dailyProcess: new Map([[today, 0]]),
    });
  }

  return appKey;
};
