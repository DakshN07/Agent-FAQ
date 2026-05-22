const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Create a reusable transporter object using the default SMTP transport.
// For production, you should use SendGrid, Resend, or AWS SES.
// Here we are using ethereal email for testing or configuring a mock transport if credentials aren't set.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a heartwarming team invitation email
 * @param {string} toEmail - The recipient's email address
 * @param {string} orgName - The organization name inviting the user
 * @param {string} eventId - The event or organization ID
 */
async function sendTeamInvite(toEmail, orgName, eventId) {
  // Generate a magic link JWT token
  const token = jwt.sign(
    { email: toEmail, organization: orgName, eventId: eventId },
    process.env.JWT_SECRET || 'supersecret_invite_key',
    { expiresIn: '7d' } // Invite expires in 7 days
  );

  // The link that the "Let's Go" button will redirect to
  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite?token=${token}`;

  // Read the banner image URL or cid
  const bannerUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/email-banner.png`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited!</title>
      <style>
        body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #1a1a2e; text-align: center; }
        .header img { width: 100%; height: auto; display: block; }
        .content { padding: 40px; text-align: center; color: #333333; }
        h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 16px; font-weight: 700; }
        p { font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 24px; }
        .highlight { color: #6d28d9; font-weight: 600; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6d28d9, #4f46e5); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(109, 40, 217, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(109, 40, 217, 0.4); }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- Placeholder for the beautiful welcome banner -->
          <img src="${bannerUrl}" alt="Welcome to the team">
        </div>
        <div class="content">
          <h1>Welcome to the team! 🎉</h1>
          <p>Hi there,</p>
          <p>We have some great news! You've been invited to join <span class="highlight">${orgName}</span> on our platform. We're building something amazing and we'd love for you to be a part of our journey.</p>
          <p>To get started, accept your invitation by clicking the button below. Your email and organization details are already configured, so it'll only take a moment!</p>
          <a href="${inviteLink}" class="btn">Let's Go</a>
        </div>
        <div class="footer">
          If you didn't expect this invitation, you can safely ignore this email.<br>
          &copy; ${new Date().getFullYear()} Agent-FAQ Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Agent-FAQ Team" <${process.env.SMTP_FROM || 'noreply@agentfaq.com'}>`,
    to: toEmail,
    subject: `👋 You're invited to join ${orgName}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTeamInvite
};
