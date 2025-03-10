const Setting = require("../models/Setting");

// Create system settings (Admin only)
const createSystemSettings = async (req, res) => {
  try {
    const { categories, defaultLimit } = req.body;
    const adminId = req.user.id;

    const settings = new Setting({ categories, defaultLimit, adminId });
    await settings.save();

    res.status(201).json({ message: "System settings created successfully.", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get system settings
const getSystemSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: "System settings not found." });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update system settings (Admin only)
const updateSystemSettings = async (req, res) => {
  try {
    const { categories, defaultLimit } = req.body;
    const settings = await Setting.findOne();
    
    if (!settings) {
      return res.status(404).json({ message: "System settings not found." });
    }

    settings.categories = categories || settings.categories;
    settings.defaultLimit = defaultLimit || settings.defaultLimit;
    await settings.save();

    res.status(200).json({ message: "System settings updated successfully.", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  createSystemSettings,
  getSystemSettings,
  updateSystemSettings
};
