import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends bulk emails with custom content.
 * @param {Array} recipients - Array of recipient objects { email, name, subject, text }.
 */
const sendBulkEmails = async (recipients) => {
  for (const recipient of recipients) {
    const { email, name, subject, text } = recipient;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${name} (${email})`);
    } catch (error) {
      console.error(`Error sending email to ${name} (${email}):`, error);
    }
  }
};

export default sendBulkEmails;