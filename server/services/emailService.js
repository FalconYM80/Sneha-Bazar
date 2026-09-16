import nodemailer from "nodemailer";

/**
 * Transporter instance cached for connection reuse
 */
let cachedTransporter = null;
let lastTransporterConfig = null;

export function getTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587", 10);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (host && user && pass) {
    const configKey = `${host}:${port}:${user}`;
    if (cachedTransporter && lastTransporterConfig === configKey) {
      return cachedTransporter;
    }

    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465, false for port 587 (STARTTLS)
      auth: { user, pass },
    });
    lastTransporterConfig = configKey;
    return cachedTransporter;
  }

  return null;
}

/**
 * Send password reset email
 * @param {string} to - Customer email address
 * @param {string} resetUrl - Full public URL to the reset password screen
 * @param {string} customerName - Customer name
 */
export async function sendPasswordResetEmail(to, resetUrl, customerName = "Customer") {
  const defaultFrom = process.env.EMAIL_USER
    ? `Sneha Bazar <${process.env.EMAIL_USER}>`
    : "Sneha Bazar <no-reply@snehabazar.com>";
  const from = process.env.EMAIL_FROM || defaultFrom;
  const resendApiKey = process.env.RESEND_API_KEY;
  const currentTransporter = getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Sneha Bazar password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F9FA;
      margin: 0;
      padding: 0;
      color: #1F2937;
    }
    .container {
      max-width: 560px;
      margin: 30px auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E5E7EB;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #111827;
      padding: 24px 32px;
      text-align: left;
    }
    .brand {
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #4B5563;
      margin-bottom: 24px;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #111827;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 12px;
    }
    .note {
      font-size: 13px;
      line-height: 1.5;
      color: #6B7280;
      background-color: #F9FAFB;
      padding: 16px;
      border-radius: 8px;
      border-left: 3px solid #9CA3AF;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #F3F4F6;
      padding: 24px 32px;
      font-size: 12px;
      color: #9CA3AF;
      text-align: center;
    }
    .link-fallback {
      word-break: break-all;
      color: #2563EB;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">Sneha Bazar</h1>
    </div>
    <div class="content">
      <h2 class="title">Password Reset Request</h2>
      <p class="text">Hello ${customerName},</p>
      <p class="text">We received a request to reset your password for your Sneha Bazar account. Click the button below to set a new password.</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>

      <div class="note">
        <strong>Important:</strong> This password reset link is valid for <strong>30 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </div>

      <p class="text" style="font-size: 13px; margin-bottom: 8px;">If the button above does not work, copy and paste this link into your web browser:</p>
      <p><a href="${resetUrl}" class="link-fallback">${resetUrl}</a></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Sneha Bazar. All rights reserved.<br>
      NH50, opposite St. Joseph Engineering College, Vamanjoor, Mangaluru, Karnataka 575028
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
Sneha Bazar - Password Reset Request

Hello ${customerName},

We received a request to reset your password for your Sneha Bazar account. Use the link below to set a new password:

${resetUrl}

This link is valid for 30 minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Sneha Bazar
NH50, opposite St. Joseph Engineering College, Vamanjoor, Mangaluru, Karnataka 575028
  `.trim();

  // 1. Resend REST API (if RESEND_API_KEY is configured)
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: "Reset your Sneha Bazar password",
          html: htmlContent,
          text: textContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend API error:", errorText);
        throw new Error("Failed to deliver reset email via provider");
      }

      return { success: true };
    } catch (err) {
      console.error("Error sending email via Resend API:", err);
      throw err;
    }
  }

  // 2. SMTP Transporter (if configured)
  if (currentTransporter) {
    try {
      await currentTransporter.sendMail({
        from,
        to,
        subject: "Reset your Sneha Bazar password",
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    } catch (err) {
      console.error("Error sending email via SMTP transporter:", err);
      throw err;
    }
  }

  // 3. Fallback for development/testing when no email provider credentials are set
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV emailService] Password reset link for ${to}: ${resetUrl}`);
  }

  return { success: true, simulated: true };
}
