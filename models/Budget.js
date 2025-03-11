const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  totalSpent: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }, // Remaining amount to spend
  period: { type: String, enum: ["daily", "weekly", "monthly"], default: "monthly" }
});

// Optional: Automatically update balance before saving
budgetSchema.pre("save", function (next) {
  this.balance = this.limit - this.totalSpent;
  next();
});


module.exports = mongoose.model("Budget"  , budgetSchema);