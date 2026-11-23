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

export const sendPaymentConfirmationEmail = async ({
  email,
  name,
  invoiceNumber,
  trxId,
  amount,
  currency = "BDT",
  planName,
  planType,
  planDuration,
  credit,
  paymentMethod,
  paidAt,
}) => {
  if (!email) return;

  if (!resend) {
    console.log(
      `[EmailService] Resend not configured. Payment confirmation for ${email}: invoice=${invoiceNumber}, trxId=${trxId}, amount=${amount} ${currency}`
    );
    return;
  }

  const safeName = escapeHtml(name || "there");
  const safeInvoice = escapeHtml(invoiceNumber || "");
  const safeTrxId = escapeHtml(trxId || "");
  const safePlanName = escapeHtml(planName || "GenMeta Plan");
  const safePlanType = escapeHtml(
    planType === "credit" ? "Credit Plan" : "Subscription Plan"
  );
  const safeMethod = escapeHtml(paymentMethod || "PayStation");
  const formattedAmount =
    currency === "BDT"
      ? `৳${Number(amount || 0).toLocaleString("en-US")}`
      : `${escapeHtml(currency)} ${Number(amount || 0).toLocaleString("en-US")}`;
  const formattedDate = paidAt
    ? new Date(paidAt).toUTCString()
    : new Date().toUTCString();
  const dashboardUrl = escapeHtml(
    `${String(config.cors_origin || "http://localhost:3000").replace(/\/+$/, "")}/dashboard`
  );

  const extraPlanRows = [
    planDuration
      ? `<tr><td style="padding: 8px 0; color: #666;">Duration</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(String(planDuration))} days</td></tr>`
      : "",
    planType === "credit" && credit
      ? `<tr><td style="padding: 8px 0; color: #666;">Credits Added</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(Number(credit).toLocaleString("en-US"))} credits</td></tr>`
      : "",
  ].join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Payment Receipt - GenMeta</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #16a34a; margin-top: 0; font-size: 20px;">Payment Confirmed</h2>
        <p>Assalamu a'laikum, ${safeName},</p>
        <p>Thank you for your purchase! Your GenMeta plan has been activated and is ready to use.</p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Amount Paid</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 16px; color: #16a34a;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Plan</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safePlanName} (${safePlanType})</td>
            </tr>
            ${extraPlanRows}
            <tr>
              <td style="padding: 8px 0; color: #666;">Payment Method</td>
              <td style="padding: 8px 0; text-align: right;">${safeMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Invoice Number</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace;">${safeInvoice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Transaction ID</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace;">${safeTrxId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Date</td>
              <td style="padding: 8px 0; text-align: right;">${escapeHtml(formattedDate)}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 6px; font-size: 15px;">
            Open Dashboard
          </a>
        </div>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GenMeta Billing <billing@genmeta.app>",
      to: email,
      subject: `Payment Receipt (${invoiceNumber}) - GenMeta`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Payment confirmation email send failed:", error.message);
  }
};

const CATEGORY_LABELS = {
  billing: "Billing",
  plan: "Plan & Credits",
  referral: "Referrals",
  security: "Security Alert",
  system: "System",
  announcement: "Announcement",
};

const PRIORITY_STYLES = {
  urgent: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", btn: "#dc2626", label: "Urgent" },
  high: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", btn: "#2563eb", label: "Important" },
  normal: { bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb", btn: "#2563eb", label: "Update" },
  low: { bg: "#f3f4f6", border: "#e5e7eb", text: "#4b5563", btn: "#2563eb", label: "Notice" },
};

function resolveNotificationEmailUrl(actionUrl, baseUrl) {
  if (!actionUrl || typeof actionUrl !== "string") return null;
  const trimmed = actionUrl.trim();
  if (!trimmed || /[\r\n\0]/.test(trimmed)) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return `${baseUrl}${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export const sendNotificationEmail = async ({
  email,
  name,
  title,
  message,
  category = "system",
  priority = "normal",
  actionUrl = null,
  actionLabel = null,
}) => {
  if (!email) {
    return { sent: false, skipped: true };
  }

  if (!resend) {
    console.log(
      `[EmailService] Resend not configured. Notification email for ${email}: [${category}/${priority}] ${title}`
    );
    return { sent: false, skipped: true };
  }

  const baseUrl = String(config.cors_origin || "http://localhost:3000").replace(/\/+$/, "");
  const safeName = escapeHtml(name || "there");
  const safeTitle = escapeHtml(title || "New Notification");
  const safeMessageHtml = escapeHtml(message || "").replace(/\r?\n/g, "<br />");
  const safeCategoryLabel = escapeHtml(CATEGORY_LABELS[category] || "Notification");
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal;
  const resolvedUrl = resolveNotificationEmailUrl(actionUrl, baseUrl);
  const safeActionUrl = resolvedUrl ? escapeHtml(resolvedUrl) : null;
  const safeActionLabel = escapeHtml(actionLabel || "View Details");
  const preferencesUrl = escapeHtml(`${baseUrl}/dashboard/notifications?tab=preferences`);

  const ctaBlock = safeActionUrl
    ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${safeActionUrl}" style="display: inline-block; background-color: ${style.btn}; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 26px; border-radius: 6px; font-size: 14px;">
            ${safeActionLabel}
          </a>
        </div>
      `
    : "";

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>${safeTitle}</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 10px;">
      ${emailHeader}
      <div style="padding: 22px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px;">
        <div style="margin-bottom: 14px;">
          <span style="display: inline-block; background-color: ${style.bg}; color: ${style.text}; border: 1px solid ${style.border}; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">
            ${safeCategoryLabel}${priority === "urgent" || priority === "high" ? ` • ${escapeHtml(style.label)}` : ""}
          </span>
        </div>
        <h2 style="color: #111827; margin-top: 0; margin-bottom: 12px; font-size: 20px;">${safeTitle}</h2>
        <p style="margin-top: 0;">Assalamu a'laikum, ${safeName},</p>
        <div style="background-color: #f9fafb; border-left: 3px solid ${style.btn}; border-radius: 4px; padding: 14px 16px; margin: 16px 0; color: #1f2937; font-size: 14px;">
          ${safeMessageHtml}
        </div>
        ${ctaBlock}
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          You can adjust your email and in-app alert settings anytime in your
          <a href="${preferencesUrl}" style="color: #2563eb; text-decoration: none;">Notification Preferences</a>.
        </p>
      </div>
      ${emailFooter}
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "GenMeta Notifications <notifications@genmeta.app>",
      to: email,
      subject: priority === "urgent" ? `[Urgent] ${title}` : `${title} - GenMeta`,
      html: emailHtml,
    });
    return { sent: true };
  } catch (error) {
    console.error("Notification email send failed:", error.message);
    return { sent: false, error: error.message };
  }
};
