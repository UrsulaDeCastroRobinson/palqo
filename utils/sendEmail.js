import nodemailer from 'nodemailer';
import { calculateEventDate, formatDate } from '../app/helpers/calculateEventDate';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (recipientEmail, recipientName) => {
  const eventDate = calculateEventDate();
  const formattedEventDate = formatDate(eventDate);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
	cc: 'tom.hosted@gmail.com',
    subject: 'Chamber music - registration confirmation',
    text: `Hello ${recipientName},\n\nThank you for registering for chamber music at 11 a.m. on ${formattedEventDate}.\n\nThe address is Flat 003, 350 The Highway, E1W 3HU.\n\nWhen you arrive, please call me on 079020 75244 to let you in as intercom doesn't work.\n\nThis is a free, community event.\n\nPeace out,\nTom`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }

  // Calculate the time until the reminder email should be sent
  const now = new Date();
  
  // Set the reminder time to 7:00 PM on the night before the event date
  const reminderDate = new Date(eventDate);
  reminderDate.setDate(eventDate.getDate() - 1);
  reminderDate.setHours(19, 0, 0, 0);

  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  // Schedule the reminder email to be sent at 7:00 PM on the night before the event date
  if (timeUntilReminder > 0) {
    setTimeout(async () => {
      const reminderMailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Chamber music tomorrow',
        text: `Hello ${recipientName},\n\nThis is a reminder about chamber music tomorrow ( ${formattedEventDate} ).\n\nLooking forward to the vibrations!\n\nPeace out,\nTom`,
      };

      try {
        await transporter.sendMail(reminderMailOptions);
        console.log('Reminder email sent successfully');
      } catch (error) {
        console.error('Error sending reminder email:', error);
      }
    }, timeUntilReminder);
  }
};

export default sendEmail;