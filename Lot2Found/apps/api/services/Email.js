const nodemailer = require('nodemailer');

/**
 * Send email using Nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email plain text content
 * @param {string} [options.html] - Optional HTML content
 */
async function sendEmail({ to, subject, text, html }) {
  if (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID) {
    console.log(`Mock sendEmail called with: to=${to}, subject=${subject}`);
    return { success: true, message: 'Mock email sent' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `${process.env.SMTP_FROM}`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending email:', err.message);
    throw err;
  }
}

module.exports = sendEmail;
