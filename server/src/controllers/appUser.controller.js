import passport from "passport";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { AppKey } from "../models/appKey.model.js";
import { generateAppKey } from "./appKey.controller.js";

// Initiate Google OAuth Login
const googleLoginAPP = asyncHandler(async (req, res, next) => {
  const { state } = req.query;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: state || undefined,
  })(req, res, next);
});

// Google Callback Logic - FIXED VERSION
const googleCallback = asyncHandler(async (req, res, next) => {
  const { state, error, error_description } = req.query;

  const parsedState = JSON.parse(state);

  // Handle user cancellation or OAuth errors
  if (error) {
    console.log("Google OAuth Error:", error, error_description);

    if (parsedState.state) {
      // Mobile app - redirect with error
      const errorUrl = `genmeta://auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || "Authentication cancelled")}&state=${state}`;

      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Authentication Cancelled</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f7f9fc;
              color: #333;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              padding: 30px 40px;
              max-width: 400px;
              width: 90%;
            }
            .logo {
              margin-bottom: 20px;
            }
            h2 {
              margin-top: 0;
              color: #e53e3e;
              font-weight: 600;
            }
            p {
              color: #4a5568;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .error-icon {
              color: #e53e3e;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .fallback {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #edf2f7;
            }
          </style>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                window.location.replace('${errorUrl}');
                
                setTimeout(function() {
                  document.getElementById('fallback').style.display = 'block';
                }, 2000);
              }, 1000);
            });
          </script>
        </head>
        <body>
          <div class="container">
            <div class="logo">GenMeta</div>
            <div class="error-icon">⚠️</div>
            <h2>Authentication Cancelled</h2>
            <p>You cancelled the login process. Redirecting you back to the application...</p>
            <div id="fallback" class="fallback" style="display: none;">
              <p>If the application doesn't open automatically, please close this window and return to the app.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return res.send(errorHtml);
    } else {
      // Web app - return JSON error response
      return new ApiResponse(400, false, "Authentication cancelled", {
        error: error,
        error_description:
          error_description || "User cancelled the authentication process",
      }).send(res);
    }
  }

  // Proceed with normal authentication
  passport.authenticate("google", { session: false }, async (err, user) => {
    try {
      // Handle authentication errors
      if (err) {
        console.error("Passport authentication error:", err);

        if (parsedState.state) {
          const errorUrl = `genmeta://auth?error=authentication_failed&error_description=${encodeURIComponent("Authentication failed")}&state=${state}`;

          const errorHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Authentication Failed</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f7f9fc;
                  color: #333;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
                }
                .container {
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  padding: 30px 40px;
                  max-width: 400px;
                  width: 90%;
                }
                .logo { margin-bottom: 20px; }
                h2 { margin-top: 0; color: #e53e3e; font-weight: 600; }
                p { color: #4a5568; line-height: 1.5; margin-bottom: 20px; }
                .error-icon { color: #e53e3e; font-size: 48px; margin-bottom: 20px; }
              </style>
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(function() {
                    window.location.replace('${errorUrl}');
                  }, 2000);
                });
              </script>
            </head>
            <body>
              <div class="container">
                <div class="logo">GenMeta</div>
                <div class="error-icon">❌</div>
                <h2>Authentication Failed</h2>
                <p>Something went wrong during authentication. Redirecting you back...</p>
              </div>
            </body>
            </html>
          `;

          return res.send(errorHtml);
        } else {
          throw new ApiError(500, "Authentication failed due to server error");
        }
      }

      // Handle case where user is not returned (shouldn't happen normally, but good to check)
      if (!user) {
        if (state) {
          const errorUrl = `genmeta://auth?error=user_not_found&error_description=${encodeURIComponent("User authentication failed")}&state=${state}`;

          const errorHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Authentication Failed</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f7f9fc;
                  color: #333;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
                }
                .container {
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  padding: 30px 40px;
                  max-width: 400px;
                  width: 90%;
                }
                .logo { margin-bottom: 20px; }
                h2 { margin-top: 0; color: #e53e3e; font-weight: 600; }
                p { color: #4a5568; line-height: 1.5; margin-bottom: 20px; }
                .error-icon { color: #e53e3e; font-size: 48px; margin-bottom: 20px; }
              </style>
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(function() {
                    window.location.replace('${errorUrl}');
                  }, 2000);
                });
              </script>
            </head>
            <body>
              <div class="container">
                <div class="logo">GenMeta</div>
                <div class="error-icon">❌</div>
                <h2>Authentication Failed</h2>
                <p>Unable to authenticate user. Redirecting you back...</p>
              </div>
            </body>
            </html>
          `;

          return res.send(errorHtml);
        } else {
          throw new ApiError(401, "Google Authentication Failed");
        }
      }

      // Success case - generate access token
      const accessToken = user.generateAccessToken();

      if (parsedState.state) {
        const redirectUrl = `genmeta://auth?token=${accessToken}&state=${parsedState.state}`;

        // Render success page with branding before redirecting
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Authentication Complete</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f7f9fc;
                  color: #333;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
                }
                .container {
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  padding: 30px 40px;
                  max-width: 400px;
                  width: 90%;
                }
                .logo {
                  margin-bottom: 20px;
                }
                h2 {
                  margin-top: 0;
                  color: #2d3748;
                  font-weight: 600;
                }
                p {
                  color: #4a5568;
                  line-height: 1.5;
                  margin-bottom: 20px;
                }
                .success-checkmark {
                  display: block;
                  margin: 0 auto 20px auto;
                  width: 50px;
                  height: 50px;
                }
                .checkmark-circle {
                  stroke-dasharray: 166;
                  stroke-dashoffset: 166;
                  stroke-width: 2;
                  stroke-miterlimit: 10;
                  stroke: #4caf50;
                  fill: none;
                  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                .checkmark {
                  width: 50px;
                  height: 50px;
                  border-radius: 50%;
                  display: block;
                  stroke-width: 6;
                  stroke: #4caf50;
                  stroke-miterlimit: 10;
                  margin: 0 auto;
                  box-shadow: inset 0px 0px 0px #4caf50;
                  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
                  position: relative;
                  top: 5px;
                  right: 5px;
                }
                .checkmark-check {
                  transform-origin: 50% 50%;
                  stroke-dasharray: 48;
                  stroke-dashoffset: 48;
                  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                }
                @keyframes stroke {
                  100% {
                    stroke-dashoffset: 0;
                  }
                }
                @keyframes scale {
                  0%, 100% {
                    transform: none;
                  }
                  50% {
                    transform: scale3d(1.1, 1.1, 1);
                  }
                }
                @keyframes fill {
                  100% {
                    box-shadow: inset 0px 0px 0px 30px transparent;
                  }
                }
                .fallback {
                  display: none;
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #edf2f7;
                }
              </style>
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(function() {
                    window.location.replace('${redirectUrl}');
                    
                    setTimeout(function() {
                      document.getElementById('fallback').style.display = 'block';
                    }, 2000);
                  }, 500);
                });
              </script>
            </head>
            <body>
              <div class="container">
                <div class="logo">GenMeta</div>
                <h2>Authentication Complete</h2>
                
                <div class="success-checkmark">
                  <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
                
                <p>You've successfully signed in. Redirecting you back to the application...</p>
                <div id="fallback" class="fallback">
                  <p>If the application doesn't open automatically, please close this window and return to the app.</p>
                </div>
              </div>
            </body>
            </html>
            `;

        return res.send(html);
      }

      // Web app success response
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
      console.error("Error in Google callback:", error);

      if (parsedState.state) {
        const errorUrl = `genmeta://auth?error=server_error&error_description=${encodeURIComponent("Server error occurred")}&state=${parsedState.state}`;
        const errorHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Server Error</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f7f9fc;
                color: #333;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .container {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                padding: 30px 40px;
                max-width: 400px;
                width: 90%;
              }
              .logo { margin-bottom: 20px; }
              h2 { margin-top: 0; color: #e53e3e; font-weight: 600; }
              p { color: #4a5568; line-height: 1.5; margin-bottom: 20px; }
              .error-icon { color: #e53e3e; font-size: 48px; margin-bottom: 20px; }
            </style>
            <script>
              document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  window.location.replace('${errorUrl}');
                }, 2000);
              });
            </script>
          </head>
          <body>
            <div class="container">
              <div class="logo">GenMeta</div>
              <div class="error-icon">🔧</div>
              <h2>Server Error</h2>
              <p>Something went wrong on our end. Please try again later.</p>
            </div>
          </body>
          </html>
        `;
        return res.send(errorHtml);
      } else {
        // Pass the error to the error handler
        next(error);
      }
    }
  })(req, res, next);
});

// Email/Password Login
const appUserLogin = asyncHandler(async (req, res) => {
  const deviceId = req.headers["x-device-id"];
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user || !user.isVerified) throw new ApiError(404, "User not found");
  if (!user.loginProvider.includes("email"))
    throw new ApiError(403, "Use social login");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const appKeyDoc = await findOrCreateAppKey(user, deviceId);

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

// Google verify
const verifyGoogle = asyncHandler(async (req, res) => {
  const deviceId = req.headers["x-device-id"];
  const user = req.user;

  const appKeyDoc = await findOrCreateAppKey(user, deviceId);

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

// Util to create or fetch API key
const findOrCreateAppKey = async (user, deviceId) => {
  let appKey = await AppKey.findOne({ userId: user._id });

  if (!appKey) {
    const plan = { type: "free" };
    const key = generateAppKey();

    appKey = await AppKey.create({
      userId: user._id,
      username: user.email,
      key,
      plan,
      credit: 100,
      lastCreditRefresh: new Date().toISOString().split("T")[0],
      deviceId,
      allowedDevices: deviceId ? [deviceId] : [],
    });
  } else {
    if (deviceId) {
      const alreadyAllowed = appKey.allowedDevices.includes(deviceId);

      if (!alreadyAllowed) {
        if (appKey.allowedDevices.length >= 2) {
          // Reject login if max device limit reached
          throw new ApiError(
            403,
            "This account is already in use on 2 devices. Contact support."
          );
        }

        // ✅ Allow new device
        appKey.allowedDevices.push(deviceId);
      }

      // Always update current active device
      appKey.deviceId = deviceId;
      await appKey.save();
    }
  }

  return appKey;
};

export { appUserLogin, googleLoginAPP, googleCallback, verifyGoogle };
