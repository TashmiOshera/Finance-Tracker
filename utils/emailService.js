const nodemailer = require("nodemailer"); 
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const SendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender address
      to, 
      subject, 
      text, 
    });
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

module.exports = { SendEmail }; // Export as an object
