const express = require("express");
const {
  createSystemSettings,
  getSystemSettings,
  updateSystemSettings
} = require("../controllers/systemSettingsController");

const { protect } = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

// Create System Settings (Admin Only)
router.post("/", protect, admin, createSystemSettings);

// Get System Settings (Authenticated Users)
router.get("/", protect, getSystemSettings);

// Update System Settings (Admin Only)
router.put("/", protect, admin, updateSystemSettings);

module.exports = router;
