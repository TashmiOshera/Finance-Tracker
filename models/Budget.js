const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  totalSpent: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  period: { type: String, required: true }, 
}, { timestamps: true });

const Budget = mongoose.model('Budget', BudgetSchema);

module.exports = Budget;
