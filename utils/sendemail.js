const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message, options) => {
  // Create transporter using SMTP (e.g., Gmail SMTP)
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE, // or use 'smtp.ethereal.email' for testing
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Your App Name" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html: message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
