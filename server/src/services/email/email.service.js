import { Resend } from "resend";
import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";

const resend = new Resend(config.resend_api_key);

const emailHeader = `
  <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; text-align: center;">
    <img 
      src="https://gen-meta-optimized.s3.ap-south-1.amazonaws.com/Assets/Asset+6.png" 
      alt="GenMeta" 
      style="max-width: 150px; height: auto; border: none;"
      onerror="this.onerror=null;this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE7OSwgMjAyMi8wNi8xMi0yMjowNTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAzLTI1VDE1OjM2OjM5WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNC0wMy0yNVQxNTozNjozOVoiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAzLTI1VDE1OjM2OjM5WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpjNDMwZWVmNi03YzIzLTRhNTgtOWU3NC03MTQxNGUxZDdiNGQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxMGU4NmNmNy1iNjE3LTc4NDAtYTc4Mi1mMmU2ZjkzMGY5NmQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjNDMwZWVmNi03YzIzLTRhNTgtOWU3NC03MTQxNGUxZDdiNGQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjNDMwZWVmNi03YzIzLTRhNTgtOWU3NC03MTQxNGUxZDdiNGQiIHN0RXZ0OndoZW49IjIwMjQtMDMtMjVUMTU6MzY6MzlaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5/zf+lAAABg0lEQVR42u3RAQ0AAAjAoPf/9LawnQi8kEDPjAg0QSCIQBAEgiAQBIEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBAEgSAIBEEgCARBIMgfH3wQfQHNfwF4uQAAAABJRU5ErkJggg=='"
    >
  </div>
`;

const emailFooter = `
  <div style="font-family: Arial, sans-serif; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; text-align: center; color: #666;">
    <p>© ${new Date().getFullYear()} GenMeta</p>
    <p>Need help? Contact <a href="mailto:support@genmeta.app" style="color: #0066cc; text-decoration: none;">support@genmeta.app</a></p>
  </div>
`;

export const sendVerificationEmail = async (email, name, token) => {
  const verificationLink = `${config.cors_origin}/verify-email?token=${token}`;
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - GenMeta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Email Verification</h2>
        <p>Assalamu a'laikum, ${name},</p>
        <p>You recently created a GenMeta account. To complete your registration, please verify your email address by clicking the link below:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #4a90e2; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </div>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p style="font-size: 12px; color: #888;">This link is valid for 24 hours.</p>
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
      text: `Hi ${name}, verify your GenMeta account: ${verificationLink}`,
      headers: {
        "X-Entity-Ref-ID": `verify-${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "Verification email send failed");
  }
};

export const sendOTPEmail = async (email, name, otp) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Security Code - GenMeta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Security Verification</h2>
        <p>Assalamu a'laikum, ${name},</p>
        <p>Here's your one-time security code for GenMeta:</p>
        <div style="background-color: #f4f4f4; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
          <span style="font-family: monospace; font-size: 24px; letter-spacing: 3px; color: #333;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #888;">This code will expire in 10 minutes.</p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GenMeta Auth <auth@genmeta.app>",
      to: email,
      subject: "Your GenMeta Security Code",
      html: emailHtml,
      text: `Hi ${name}, your GenMeta security code is: ${otp}`,
      headers: {
        "X-Entity-Ref-ID": `otp-${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "OTP email send failed");
  }
};
