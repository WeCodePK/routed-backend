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

module.exports = { sendMail };