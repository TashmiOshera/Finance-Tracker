const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    // Find all notifications for the logged-in user, sorted by the most recent
    const notifications = await Notification.find({ userId: req.user._id }).sort({ date: -1 });

    // Return the notifications as JSON
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
