import mongoose from "mongoose";

function createCategoryPrefField(defaultEmail) {
  return {
    type: new mongoose.Schema(
      {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: defaultEmail },
      },
      { _id: false }
    ),
    default: () => ({ inApp: true, email: defaultEmail }),
  };
}

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    categories: {
      billing: createCategoryPrefField(true),
      plan: createCategoryPrefField(true),
      referral: createCategoryPrefField(true),
      security: createCategoryPrefField(true),
      system: createCategoryPrefField(false),
      announcement: createCategoryPrefField(true),
    },
    toastEnabled: {
      type: Boolean,
      default: true,
    },
    soundEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model(
    "NotificationPreference",
    notificationPreferenceSchema,
    "notificationpreferences"
  );

export default NotificationPreference;
