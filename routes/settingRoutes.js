const express = require("express");
const {
  configureSystemSettings,
  getSystemSettings
} = require("../controllers/systemSettingsController");

const { protect } = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

// ✅ Admin Configures System Settings (Create or Update)
router.post("/", protect, admin, configureSystemSettings);

// ✅ Users Can View System Settings
router.get("/", protect, getSystemSettings);

module.exports = router;
