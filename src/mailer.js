const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  secure: true,
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM;

  try {
    return await transporter.sendMail({ from, to, subject, text, html });
  }

  catch (error) {
    console.error('[ERROR] Failed to send email:', error);
    return false;
  }
}

function forgotPasswordTemplate({name, resetToken, expiryMinutes}) {
  return {
    subject: "[routed] Reset Your Password",
    text: `Hi ${fields.name},\n\nWe received a request to reset your password.\nClick the link below to choose a new password:\n\nhttps://routed-web.wckd.pk/reset/${fields.resetToken}\n\nThis link will expire in ${fields.expiryMinutes} minutes.\nIf you didn't request a password reset, you can safely ignore this email.\n\nThanks,\nThe routed team.`
  }
}

module.exports = {
  sendMail,
  forgotPasswordTemplate
};