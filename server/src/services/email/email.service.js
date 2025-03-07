import { Resend } from "resend";
import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";

const resend = new Resend(config.resend_api_key);

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${config.cors_origin}/verify-email?token=${token}`;
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verify Your Email",
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "Verification email send failed");
  }
};
