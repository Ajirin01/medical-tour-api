const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, otpCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT), // 465
      secure: true, // port 465 requires secure:true
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Define the HTML template with dynamic placeholders
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7fc;
          }
          .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4CAF50;
          }
          .content {
            font-size: 16px;
            line-height: 1.5;
            color: #555555;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            font-size: 12px;
            color: #777777;
          }
          .button {
            display: inline-block;
            padding: 12px 20px;
            margin-top: 20px;
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
          }
          .button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>OTP for Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering with us. Your one-time password (OTP) for email verification is:</p>
            <h2 style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otpCode}</h2>
            <p>Please use this OTP to complete your verification process.</p>
          </div>
          <div class="footer">
            <p>If you did not register with us, please ignore this email.</p>
            <p>Global Health Solutions - All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Global Health Solutions" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlTemplate,  // Send the HTML template as the email body
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;
