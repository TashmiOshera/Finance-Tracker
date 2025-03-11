const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth'); 
const router = express.Router();


router.get('/', protect, async (req, res) => {
  try {
    console.log("User ID:", req.user._id);  // Debugging

    const notifications = await Notification.find({ userId: req.user._id }).sort({ date: -1 });

    console.log("Fetched Notifications:", notifications); // Debugging

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
