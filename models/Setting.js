const mongoose = require("mongoose");

const SystemSettingsSchema = new mongoose.Schema({
  categories: [{ type: String, required: true }], 
  defaultLimit: { type: Number, required: true }, 
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } 
});


module.exports = mongoose.model("Setting", SystemSettingsSchema);
