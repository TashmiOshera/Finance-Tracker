// controllers/notificationController.js
const Notification = require('../models/Notification');

// Get all notifications for the user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found' });
    }

    res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getNotifications,
};
