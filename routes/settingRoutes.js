const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const Setting = require('../models/Setting');

const router = express.Router();

// Admin: Update system settings
router.put('/settings', protect, admin, async (req, res) => {
  const { categories, limits } = req.body;

  let setting = await Setting.findOne();

  if (!setting) {
    setting = new Setting({ categories, limits });
  } else {
    setting.categories = categories || setting.categories;
    setting.limits = limits || setting.limits;
  }

  await setting.save();
  res.json({ message: 'System settings updated' });
});

module.exports = router;
