import { Resend } from "resend";
import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";

const resend = new Resend(config.resend_api_key);

// Common header and footer for brand consistency
const emailHeader = `
  <div style="background-color: #f8f9fa; padding: 20px 0; text-align: center;">
    <img src="https://via.placeholder.com/150x50" alt="Your Company Logo" style="max-width: 150px; height: auto;">
  </div>
`;

const emailFooter = `
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #6c757d; font-size: 12px; text-align: center;">
    <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
    <p>If you have any questions, please contact our support team at <a href="mailto:support@yourcompany.com" style="color: #007bff; text-decoration: none;">support@yourcompany.com</a></p>
    <p style="color: #999;">This is an automated message, please do not reply directly to this email.</p>
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
      <title>Email Verification</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      ${emailHeader}
      
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <h2 style="color: #2c3e50; margin-top: 0; font-weight: 600;">Verify Your Email Address</h2>
        
        <p style="margin-bottom: 25px;">Thank you for creating an account with us. To ensure the security of your account and to activate all features, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;">Verify My Email</a>
        </div>
        
        <p style="margin-bottom: 10px;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="margin-bottom: 25px; word-break: break-all; font-size: 14px; color: #0066cc;">${verificationLink}</p>
        
        <p style="margin-bottom: 25px;">This verification link will expire in 24 hours. If you did not create an account with us, please disregard this email.</p>
        
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="font-weight: 500;">The Your Company Team</p>
      </div>
      
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Please Verify Your Email Address",
      html: emailHtml,
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
      <title>Password Reset OTP</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      ${emailHeader}
      
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <h2 style="color: #2c3e50; margin-top: 0; font-weight: 600;">Password Reset Request</h2>
        
        <p>We received a request to reset the password for your account. Please use the verification code below to complete the process:</p>
        
        <div style="background-color: #f7f9fc; border: 1px solid #e3e8f0; border-radius: 5px; padding: 15px; margin: 25px 0; text-align: center;">
          <span style="font-family: 'Courier New', monospace; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #0066cc;">${otp}</span>
        </div>
        
        <p style="margin-bottom: 20px;">This verification code will expire in 10 minutes for security reasons.</p>
        
        <div style="background-color: #fff8e6; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; font-weight: 500;">Important Security Notice:</p>
          <p style="margin: 5px 0 0 0;">If you did not request a password reset, please contact our support team immediately or secure your account by changing your password.</p>
        </div>
        
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="font-weight: 500;">The Your Company Security Team</p>
      </div>
      
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Your Password Reset Verification Code",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "OTP email send failed");
  }
};
