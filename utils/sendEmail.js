// utils/sendEmail.js

const nodemailer = require('nodemailer');
const { generateOTPEmailHTML } = require('./emailTemplates');

const sendEmail = async ({ to, subject, text, html, otpCode }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Global Health Solutions <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || (otpCode ? generateOTPEmailHTML(otpCode) : null),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;