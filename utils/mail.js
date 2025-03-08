const nodemailer = require('nodemailer');

const sendEmailNotification = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to any email service provider
    auth: {
      user: 'your-email@gmail.com', // Your email here
      pass: 'your-email-password',  // Your email password here (Consider using environment variables for sensitive info)
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to:', email);
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};
