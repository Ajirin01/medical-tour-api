const axios = require('axios');

const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`);

  return response.data.success;
};

module.exports = verifyRecaptcha;
