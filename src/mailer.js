const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(process.env.SMTP_URL, {
  secure: process.env.SMTP_URL.startsWith('smtps://')
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

module.exports = {
    sendMail,

    forgotPasswordTemplate({name, resetToken, expiry}) {
        return {
            subject: "[routed] Reset Your Password",
            text: `Hi ${name},\n\nWe received a request to reset your password.\nClick the link below to choose a new password:\n\nhttps://routed-web.wckd.pk/reset/${resetToken}\n\nThis link will expire in ${expiry}.\nIf you didn't request a password reset, you can safely ignore this email.\n\nThanks,\nThe routed team.`
        }
    },

    driverLoginOtpTemplate({name, otpCode, expiry}) {
        return {
            subject: `[routed] ${otpCode} is your OTP code for login`,
            text: `Hi ${name},\nYour One-Time Password for login is:\n\n${otpCode}\n\nThis code is valid for the next ${expiry}.\nPlease do not share this code with anyone. If you did not request this code, please ignore this email.\n\nThanks,\nThe routed team.`
        }
    }
};