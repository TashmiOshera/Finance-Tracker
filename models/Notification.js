const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  limit: { type: Number, required: true },
  totalSpent: { type: Number, required: true },
  balanceAfterSpending: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ["budget", "recurring"], required: true },
  recurringDetails: {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    status: { type: String, enum: ["upcoming", "missed"], default: "upcoming" },
    taskName: { type: String },  // Task name or description
    amount: { type: Number },  // Amount for recurring transaction
    nextDueDate: { type: Date } // Add due date field here
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
