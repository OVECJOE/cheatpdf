import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, url: string) {
  const { host } = new URL(url);
  
  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to your account</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 32px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin: 24px 0;
    }
    .button:hover {
      background: #2563eb;
    }
    .footer {
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .security-note {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      font-size: 14px;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${process.env.NEXT_PUBLIC_APP_NAME || "CheatPDF"}</div>
    </div>

    <h1 class="title">Sign in to your account</h1>
    
    <p>Click the button below to securely sign in to your account. This link will expire in 24 hours.</p>
    
    <div style="text-align: center;">
      <a href="${url}" class="button">Sign In</a>
    </div>
    
    <div class="security-note">
      <strong>Security tip:</strong> This link will only work once and expires in 24 hours. If you didn't request this email, you can safely ignore it.
    </div>
    
    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">${url}</p>
  </div>
  
  <div class="footer">
    <p>This email was sent from ${host}. If you have any questions, please contact our support team.</p>
  </div>
</body>
</html>
  `;

  const textTemplate = `
Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || "StudyApp"}

Click the link below to sign in to your account:
${url}

This link will expire in 24 hours and can only be used once.

If you didn't request this email, you can safely ignore it.

---
This email was sent from ${host}
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `noreply@${host}`,
      to: email,
      subject: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || "CheatPDF"}`,
      text: textTemplate,
      html: emailTemplate,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error("Failed to send email");
    }
    return data;
  } catch (error) {
    throw error;
  }
}