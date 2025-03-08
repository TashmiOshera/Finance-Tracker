const mongoose = require("mongoose");

const SystemSettingsSchema = new mongoose.Schema({
  categories: [{ type: String, required: true }], // List of expense categories
  defaultLimit: { type: Number, required: true }, // Default budget limit for new users
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } // Admin reference
});

// ✅ Ensure this is correctly exported
module.exports = mongoose.model("Setting", SystemSettingsSchema);
