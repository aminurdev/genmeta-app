import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import config from "../config/index.js";
import { ApiKey } from "../models/appApiKey.model.js";
import { generateApiKey } from "./appApiKey.controller.js";

// Setup Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id,
      clientSecret: config.google_client_secret,
      callbackURL: config.google_callback_url,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            loginProvider: "google",
            googleId: profile.id,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and Deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Initiate Google OAuth Login
const googleLoginAPP = asyncHandler(async (req, res, next) => {
  const { state } = req.query;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: state || undefined,
  })(req, res, next);
});

// Google Callback Logic
const googleCallback = asyncHandler(async (req, res, next) => {
  const { state } = req.query;

  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      throw new ApiError(401, "Google Authentication Failed");
    }

    const accessToken = user.generateAccessToken();

    if (state) {
      const redirectUrl = `genmeta://auth?token=${accessToken}&state=${state}`;

      // Render a professional page with branding before redirecting
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
                // Wait 1 second before redirecting
                setTimeout(function() {
                  // Use window.location.replace to prevent adding to browser history
                  window.location.replace('${redirectUrl}');
                  
                  // Fallback in case the protocol handler doesn't work
                  setTimeout(function() {
                    document.getElementById('fallback').style.display = 'block';
                  }, 2000);
                }, 500);
              });
            </script>
          </head>
          <body>
            <div class="container">
              <!-- Replace with your actual logo -->
              <div class="logo">
                <!-- <img src="/path/to/your/logo.png" alt="Logo" height="40"> -->
                GenMeta
              </div>
              <h2>Authentication Complete</h2>
              
              <!-- Success Checkmark Animation -->
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

    return new ApiResponse(200, true, "Google authentication successful", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    }).send(res);
  })(req, res, next);
});

// Email/Password Login
const appUserLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) throw new ApiError(404, "User not found");
  if (user.loginProvider !== "email")
    throw new ApiError(403, "Use social login");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const apiKeyDoc = await findOrCreateApiKey(user);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    apiKey: apiKeyDoc.key,
  }).send(res);
});

// For verifying Google user and generating key
const verifyGoogle = asyncHandler(async (req, res) => {
  const user = req.user;
  const apiKeyDoc = await findOrCreateApiKey(user);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    apiKey: apiKeyDoc.key,
  }).send(res);
});

// Util to create or fetch API key
const findOrCreateApiKey = async (user) => {
  let apiKey = await ApiKey.findOne({ userId: user._id });

  if (!apiKey) {
    const plan = { type: "free" };
    const key = generateApiKey();

    apiKey = await ApiKey.create({
      userId: user._id,
      username: user.email,
      key,
      plan,
      credit: 10,
      lastCreditRefresh: new Date().toISOString().split("T")[0],
    });
  }

  return apiKey;
};

export { appUserLogin, googleLoginAPP, googleCallback, verifyGoogle };
