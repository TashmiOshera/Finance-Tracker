const Setting = require("../models/Setting");

// ✅ Create or Update System Settings (Admin Only)
const configureSystemSettings = async (req, res) => {
  try {
    const { categories, defaultLimit } = req.body;
    const adminId = req.user ? req.user.id : null;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    if (!categories && !defaultLimit) {
      return res.status(400).json({ message: "At least one field (categories or defaultLimit) is required." });
    }

    let settings = await Setting.findOne();

    if (!settings) {
      // If settings do not exist, create new settings
      settings = new Setting({ categories, defaultLimit, adminId });
      await settings.save();
      return res.status(201).json({ message: "System settings created successfully.", settings });
    }

    // If settings exist, update them
    if (categories) settings.categories = categories;
    if (defaultLimit) settings.defaultLimit = defaultLimit;

    await settings.save();
    res.status(200).json({ message: "System settings updated successfully.", settings });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get System Settings (Accessible by all users)
const getSystemSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: "System settings not found." });
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching system settings:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Export functions
module.exports = {
  configureSystemSettings,
  getSystemSettings
};
