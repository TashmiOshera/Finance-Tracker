const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  limit: { type: Number },
  totalSpent: { type: Number },
  balanceAfterSpending: { type: Number },
  date: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ["budget", "recurring", "goal", "budget_exceeded"], 
    required: true 
  },
  recurringDetails: {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    status: { type: String, enum: ["upcoming", "missed"], default: "upcoming" },
    taskName: { type: String },
    amount: { type: Number },
    nextDueDate: { type: Date }
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
