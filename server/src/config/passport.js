import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./index.js";
import { User } from "../models/user.model.js";

// Configure Google OAuth Strategy
const configureGoogleStrategy = () => {
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: config.google_client_id,
        clientSecret: config.google_client_secret,
        callbackURL: config.google_callback_url,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Validate profile data
          if (!profile.emails || profile.emails.length === 0) {
            return done(new Error("No email found in Google profile"), null);
          }

          const email = profile.emails[0].value;
          const displayName =
            profile.displayName || profile.name?.givenName || "Unknown User";

          // Check if user already exists
          let user = await User.findOne({ email });

          if (!user) {
            // Create new user
            user = await User.create({
              name: displayName,
              email,
              loginProvider: ["google"],
              googleId: profile.id,
              isVerified: true,
              avatar: profile.photos?.[0]?.value || null,
              token: { available: 20, used: 0 },
            });
            console.log(`New Google user created: ${email}`);
          } else {
            // Update existing user if needed
            let needsUpdate = false;

            if (!user.googleId) {
              user.googleId = profile.id;
              needsUpdate = true;
            }

            if (!user.loginProvider.includes("google")) {
              user.loginProvider.push("google");
            }

            if (!user.isVerified) {
              user.isVerified = true;
              needsUpdate = true;
            }

            if (!user.profilePicture && profile.photos?.[0]?.value) {
              user.profilePicture = profile.photos[0].value;
              needsUpdate = true;
            }

            if (user.name !== displayName) {
              user.name = displayName;
              needsUpdate = true;
            }

            if (needsUpdate) {
              await user.save();
              console.log(`Google user updated: ${email}`);
            }
          }

          return done(null, user);
        } catch (error) {
          console.error("Google Strategy Error:", error);
          return done(error, null);
        }
      }
    )
  );
};

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (error) {
    console.error("Deserialize User Error:", error);
    done(error, null);
  }
});

// Initialize Passport configuration
const initializePassport = (app) => {
  // Configure Google Strategy
  configureGoogleStrategy();

  // Initialize Passport
  app.use(passport.initialize());

  // Note: Only use passport.session() if you're using sessions
  // For JWT-based auth, you typically don't need sessions
  // app.use(passport.session());

  console.log("Passport configured successfully");
};

export { initializePassport, configureGoogleStrategy };
