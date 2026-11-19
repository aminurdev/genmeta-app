import { Resend } from "resend";
import config from "../../config/index.js";

const resend = config.resend_api_key ? new Resend(config.resend_api_key) : null;

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

export const sendVerificationEmail = async (email, name, verificationCode) => {
  if (!resend) {
    console.log(`[EmailService] Resend not configured. Simulation for ${email}: Verification code is ${verificationCode}`);
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Verify Your Email</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Email Verification</h2>
        <p>Assalamu a'laikum, ${name},</p>
        <p>You recently registered a GenMeta account. To verify your email address, please use the code below:</p>
        <div style="background-color: #f4f4f4; border: 2px solid #4a90e2; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4a90e2;">${verificationCode}</span>
        </div>
        <p>This code is valid for 15 minutes.</p>
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
    // Don't crash whole registration if email service fails in staging
    if (config.isProduction) {
      throw error;
    }
  }
};

export const sendOTPEmail = async (email, name, otp) => {
  if (!resend) {
    console.log(`[EmailService] Resend not configured. Simulation for ${email}: OTP is ${otp}`);
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Your Security Code</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Security Verification Code</h2>
        <p>Assalamu a'laikum, ${name},</p>
        <p>Your one-time password (OTP) is:</p>
        <div style="background-color: #f4f4f4; border: 2px solid #4a90e2; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4a90e2;">${otp}</span>
        </div>
        <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GenMeta Security <auth@genmeta.app>",
      to: email,
      subject: "Your Security Code - GenMeta",
      html: emailHtml,
    });
  } catch (error) {
    console.error("OTP email send failed:", error.message);
    if (config.isProduction) {
      throw error;
    }
  }
};
