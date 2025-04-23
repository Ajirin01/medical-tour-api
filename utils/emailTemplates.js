// utils/emailTemplates.js

const fs = require('fs');
const path = require('path');

const generateOTPEmailHTML = (otpCode) => {
  const emailTemplate = fs.readFileSync(path.join(__dirname,'..', 'templates', 'email-template.html'), 'utf8');
  return emailTemplate.replace('{OTP_CODE}', otpCode);
};

module.exports = { generateOTPEmailHTML };