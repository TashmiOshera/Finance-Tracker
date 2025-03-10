const mongoose = require("mongoose");   

const savingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Saving", savingsSchema);
