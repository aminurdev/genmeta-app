import { Resend } from "resend";
import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";

const resend = new Resend(config.resend_api_key);

// Common header and footer for brand consistency
const emailHeader = `
  <div style="background-color: #f0f4f8; padding: 20px; text-align: center;">
    <img src="https://i.ibb.co.com/bgHFd6m7/Gen-Meta-Logo.png" alt="GenMeta Logo" style="max-width: 150px; height: auto;">
  </div>
`;

const emailFooter = `
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #6c757d; font-size: 12px; text-align: center;">
    <p>© ${new Date().getFullYear()} GenMeta. All rights reserved.</p>
    <p>If you need help, contact our support team at <a href="mailto:support@genmeta.app" style="color: #007bff; text-decoration: none;">support@genmeta.app</a></p>
    <p style="color: #999;">You received this email because you recently signed up for GenMeta. If you didn't request this, please ignore this email.</p>
  </div>
`;

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${config.cors_origin}/verify-email?token=${token}`;
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      ${emailHeader}
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <h2 style="color: #2c3e50; margin-top: 0;">Verify Your Email Address</h2>
        <p style="margin-bottom: 25px;">Welcome to GenMeta! To activate your account, please confirm your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Confirm Email</a>
        </div>
        <p>If you can’t click the button, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #0066cc;">${verificationLink}</p>
        <p>This link will expire in 24 hours for your security.</p>
        <p>If you didn’t request this email, no further action is required.</p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "support@genmeta.app",
      to: email,
      subject: "Confirm Your Email Address - GenMeta",
      html: emailHtml,
      text: `Welcome to GenMeta! Click the link to confirm your email: ${verificationLink}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "Verification email send failed");
  }
};

export const sendOTPEmail = async (email, otp) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      ${emailHeader}
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <h2 style="color: #2c3e50; margin-top: 0;">Your OTP Code</h2>
        <p>Please use the following One-Time Password (OTP) to proceed with your account security actions:</p>
        <div style="background-color: #f7f9fc; border: 1px solid #e3e8f0; border-radius: 5px; padding: 15px; margin: 25px 0; text-align: center;">
          <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0066cc;">${otp}</span>
        </div>
        <p>This OTP will expire in 10 minutes for security reasons.</p>
        <p>If you didn’t request this code, please ignore this email or contact our support team.</p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "support@genmeta.app",
      to: email,
      subject: "Your OTP Code - GenMeta",
      html: emailHtml,
      text: `Your OTP Code: ${otp}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "OTP email send failed");
  }
};
