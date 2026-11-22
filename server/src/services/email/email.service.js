import { Resend } from "resend";
import config from "../../config/index.js";

const resend = config.resend_api_key ? new Resend(config.resend_api_key) : null;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const emailHeader = `
  <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; text-align: center;">
    <h1 style="color: #4a90e2; margin: 0; font-size: 24px;">GenMeta</h1>
  </div>
`;

const emailFooter = `
  <div style="font-family: Arial, sans-serif; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; text-align: center; color: #666;">
    <p>© ${new Date().getFullYear()} GenMeta. All rights reserved.</p>
    <p>Need help? Contact <a href="mailto:support@genmeta.app" style="color: #0066cc; text-decoration: none;">support@genmeta.app</a></p>
  </div>
`;

export const sendVerificationEmail = async (
  email,
  name,
  verificationCode,
  verificationLink = null
) => {
  if (!resend) {
    console.log(
      `[EmailService] Resend not configured. Verification for ${email}: code=${verificationCode}${
        verificationLink ? `, link=${verificationLink}` : ""
      }`
    );
    return;
  }

  const safeName = escapeHtml(name || "there");
  const safeCode = escapeHtml(verificationCode);
  const safeLink = verificationLink ? escapeHtml(verificationLink) : null;

  const linkBlock = safeLink
    ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${safeLink}" style="display: inline-block; background-color: #4a90e2; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 6px; font-size: 15px;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #666; text-align: center;">Or enter the 6-digit verification code below:</p>
      `
    : `<p>To verify your email address, please enter the 6-digit code below:</p>`;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Verify Your Email</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Email Verification</h2>
        <p>Assalamu a'laikum, ${safeName},</p>
        <p>You recently registered a GenMeta account.</p>
        ${linkBlock}
        <div style="background-color: #f4f4f4; border: 2px solid #4a90e2; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4a90e2;">${safeCode}</span>
        </div>
        <p>This verification code and link are valid for <strong>15 minutes</strong> and can only be used once. Do not share them with anyone.</p>
        <p style="font-size: 12px; color: #777;">If you did not create a GenMeta account, you can safely ignore this email.</p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GenMeta Auth <auth@genmeta.app>",
      to: email,
      subject: "Verify Your GenMeta Account",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Email send failed:", error.message);
    if (config.isProduction) {
      throw error;
    }
  }
};

export const sendPasswordResetOTP = async (email, name, otp) => {
  if (!resend) {
    console.log(`[EmailService] Resend not configured. Password reset OTP for ${email}: ${otp}`);
    return;
  }

  const safeName = escapeHtml(name || "there");
  const safeOtp = escapeHtml(otp);

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Password Reset Code</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
        <p>Assalamu a'laikum, ${safeName},</p>
        <p>We received a request to reset your GenMeta password. Enter the 6-digit security code below to continue:</p>
        <div style="background-color: #f4f4f4; border: 2px solid #4a90e2; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4a90e2;">${safeOtp}</span>
        </div>
        <p>This code expires in <strong>15 minutes</strong>. Never share this code with anyone.</p>
        <p style="font-size: 12px; color: #777;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GenMeta Security <auth@genmeta.app>",
      to: email,
      subject: "Password Reset Code - GenMeta",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Password reset OTP email send failed:", error.message);
    if (config.isProduction) {
      throw error;
    }
  }
};

// Backwards-compatible alias
export const sendOTPEmail = sendPasswordResetOTP;
