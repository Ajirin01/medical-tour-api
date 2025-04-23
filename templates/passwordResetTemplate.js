const getPasswordResetTemplate = (resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c5282; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Global Health Solutions</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <p>For security reasons, this link will expire in 10 minutes.</p>
          <p>Best regards,<br>Global Health Solutions Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = getPasswordResetTemplate;